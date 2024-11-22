#!/bin/bash

#SBATCH --job-name="Rosie FastAPI Template - Slurm Job"
#SBATCH --output=output/job_%j.out
#SBATCH --mail-type=ALL
#SBATCH --partition=teaching
#SBATCH --nodes=1
#SBATCH --gres=gpu:t4:1
#SBATCH --cpus-per-gpu=4
#SBATCH --time=06:00:00

echo "Starting up Database..."

/data/ai_club/nes_2025/database/bin/pg_ctl -D /data/ai_club/nes_2025/database/data start
echo "$(ls -l /tmp/.s.PGSQL.5432)"

echo "Database Started..."

## Ensure output and image directories exist
mkdir -p output
mkdir -p image

## Set secure permissions for the output log file
chmod 600 output/job_${SLURM_JOB_ID}.out

## Default values
MAIL_USER="norquistd@msoe.edu"
DOCKER_IMAGE="nvidia/cuda:12.5.0-devel-ubuntu22.04"
IMAGE_PATH="./image/container.sif"
PASSWORD_FILE="./password.txt"
FORCE_REBUILD=false

## Parse optional command-line arguments
while getopts "m:i:f" opt; do
    case $opt in
        m) MAIL_USER="$OPTARG" ;;
        i) DOCKER_IMAGE="$OPTARG" ;;
        f) FORCE_REBUILD=true ;;
        *) echo "Usage: sbatch $0 [-m mail_user] [-i docker_image] [-f (force rebuild)]" >&2
           exit 1 ;;
    esac
done

## Set the mail user dynamically based on the parsed argument
#SBATCH --mail-user=${MAIL_USER}

## Function to find an open port, starting with a random user port (1024-49151)
find_port() {
    local start_port=1024
    local end_port=49151
    local random_port=$((RANDOM % (end_port - start_port + 1) + start_port))

    # Check the random port first
    if ! (echo > "/dev/tcp/localhost/$random_port") &>/dev/null; then
        echo "$random_port"
        return 0
    fi

    # If the random port is not available, check sequentially from start_port to end_port
    for ((port=start_port; port<=end_port; port++)); do
        if ! (echo > "/dev/tcp/localhost/$port") &>/dev/null; then
            echo "$port"
            return 0
        fi
    done

    echo "No open port found in the range $start_port-$end_port" >&2
    return 1
}

## Function to generate a random password if the password file does not exist or is empty
generate_password() {
    if [[ -f "$PASSWORD_FILE" && -s "$PASSWORD_FILE" ]]; then
        echo "Using existing password from $PASSWORD_FILE"
        PASSWORD=$(cat "$PASSWORD_FILE")
    else
        echo "Generating a new random password..."
        PASSWORD=$(openssl rand -base64 16)
        echo "$PASSWORD" > "$PASSWORD_FILE"
        chmod 600 "$PASSWORD_FILE"
        echo "Password saved to $PASSWORD_FILE with restricted permissions."
    fi
}

## Function to pull Docker image and build Singularity image if it does not exist or if forced
build_singularity_image() {
    if [[ "$FORCE_REBUILD" == true ]]; then
        echo "Force rebuild enabled. Removing existing Singularity image: $IMAGE_PATH..."
        rm -f "$IMAGE_PATH"
    fi

    if [[ ! -f "$IMAGE_PATH" ]]; then
        echo "Building Singularity image from Docker image: $DOCKER_IMAGE (Force Rebuild: $FORCE_REBUILD)..."
        singularity build "$IMAGE_PATH" "docker://$DOCKER_IMAGE"
        if [[ $? -eq 0 ]]; then
            echo "Singularity image built successfully: $IMAGE_PATH"
        else
            echo "Failed to build Singularity image. Exiting."
            exit 1
        fi
    else
        echo "Singularity image already exists: $IMAGE_PATH"
    fi
}

## SCRIPT START

echo "Executing node hostname: $(hostname)"

# Build the Singularity image if needed
build_singularity_image

# Find an open port and store it in a variable
PORT=$(find_port)
if [ $? -eq 0 ]; then
    echo "Found open port: $PORT"
else
    echo "Failed to find an open port. Exiting."
    exit 1
fi

# Determine the host and URLs
HOST=$(hostname)
export BASE_URL="/node/${HOST}.hpc.msoe.edu/${PORT}"
MODIFIED_URL=$(echo "$BASE_URL" | sed -e 's#^/node/##' -e 's#/[^/]*$##')

echo "BASE_URL: $BASE_URL"
echo "MODIFIED_URL: $MODIFIED_URL"

# Generate or retrieve the password
generate_password

# Create the hashed+salted password
export SALT=$(openssl rand -hex 16)
export API_TOKEN=$(echo -n "${SALT}${PASSWORD}" | openssl dgst -sha256 | awk '{print $2}')

# Run the Singularity container with the generated API token
echo "Running Singularity container..."

singularity exec --nv --network-args portmap=$PORT:$PORT -B /data:/data $IMAGE_PATH uvicorn --app-dir /var/task/app main:app --port $PORT --host $MODIFIED_URL

echo "Singularity container execution finished."

## SCRIPT END
