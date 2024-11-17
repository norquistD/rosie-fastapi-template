# Wait for the FastAPI Template server to start
echo "$(date): Waiting for FastAPI Template to open port ${port}..."
if wait_until_port_used "${host}:${port}" 600; then
  echo "$(date): Discovered FastAPI server listening on port ${port}!"
else
  echo "$(date): Timed out waiting for FastAPI Server to open port ${port}!"
  clean_up 1
fi
sleep 2