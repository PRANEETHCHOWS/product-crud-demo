from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:Praneeth%402028@localhost:5432/fastapi_db"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        print("Database connected successfully!")
except Exception as e:
    print("Connection failed:")
    print(e)
