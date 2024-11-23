import asyncpg

async def open_connection(dbname: str, user: str, password: str, host: str, port: str) -> asyncpg.Connection:
    try:
        connection = await asyncpg.connect(
            database=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )
        return connection
    except asyncpg.OperationalError as e:
        print(f'Database connection error: {e}')
        return None
    
async def run_command(sql:str, arguments, connection: asyncpg.Connection):
    try:
        await connection.execute(sql, *arguments)
    except Exception as e:
        print(f'Failed to execute SQL command: {e}')
        await connection.execute('ROLLBACK')
        
async def close_connection(connection: asyncpg.Connection) -> None:
    if connection:
        await connection.close()