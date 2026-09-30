import asyncio
import sys
from app.database import init_db, close_db, AsyncSessionLocal
from app.models.excipient import Excipient
from app.models.user import User
from sqlalchemy import select, func

async def main():
    print("Testing MySQL connection and table initialization...")
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # Check users count
        res_users = await session.execute(select(func.count(User.id)))
        user_count = res_users.scalar()
        print(f"Users in MySQL: {user_count}")
        
        # Check excipients count
        res_exc = await session.execute(select(func.count(Excipient.id)))
        exc_count = res_exc.scalar()
        print(f"Excipients in MySQL: {exc_count}")
        
        # Print first 5 excipients
        res_sample = await session.execute(select(Excipient).limit(5))
        samples = res_sample.scalars().all()
        print("Sample seeded excipients:")
        for s in samples:
            print(f" - {s.name} ({s.category}): {s.function}")

    await close_db()
    print("MySQL verification completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
