from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


db_url = "postgresql://postgres:Praneeth%402028@localhost:5432/fast_db"

engine = create_engine(db_url)
session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
