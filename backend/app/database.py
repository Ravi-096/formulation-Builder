import logging
import ssl
from datetime import datetime, timezone
from typing import AsyncGenerator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.models.excipient import Excipient
from app.models.formulation import Formulation

logger = logging.getLogger("uvicorn.default")


def get_engine_connect_args() -> dict:
    """Build driver connection arguments including SSL context if required."""
    connect_args = {}
    ssl_mode = getattr(settings, "MYSQL_SSL_MODE", "").upper()
    is_ssl_needed = (
        ssl_mode in ("REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY")
        or "aivencloud.com" in settings.MYSQL_HOST
        or "aivencloud.com" in settings.MYSQL_URL
    )
    if is_ssl_needed:
        ssl_ctx = ssl.create_default_context()
        ca_path = getattr(settings, "MYSQL_SSL_CA", None)
        if ca_path:
            ssl_ctx.load_verify_locations(ca_path)
            ssl_ctx.verify_mode = ssl.CERT_REQUIRED
            ssl_ctx.check_hostname = True
        else:
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx
    return connect_args


# Async SQLAlchemy Engine & Session Factory
engine = create_async_engine(
    settings.MYSQL_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=get_engine_connect_args(),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an async SQLAlchemy database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize MySQL tables and seed defaults:
    - Creates tables if they do not exist
    - Seeds default users (admin, user)
    - Seeds 20 essential pharmaceutical excipients
    """
    logger.info(f"Connecting to MySQL database at {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("MySQL tables initialized successfully: [users, excipients, formulations].")

    # Seed initial datasets
    async with AsyncSessionLocal() as session:
        await seed_default_users(session)
        await seed_default_excipients(session)


async def seed_default_users(session: AsyncSession):
    """Seed initial demo accounts into MySQL if they do not exist."""
    from app.core.security import get_password_hash

    default_accounts = [
        {
            "email": "admin@example.com",
            "username": "admin_alex",
            "name": "Dr. Alex Morgan",
            "role": "Chief Scientist & Administrator",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "password": "password123",
        },
        {
            "email": "user@example.com",
            "username": "sarah_dev",
            "name": "Sarah Connor",
            "role": "Pharmacologist & Formulation Engineer",
            "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "password": "password123",
        },
    ]

    for acc in default_accounts:
        stmt = select(User).where((User.email == acc["email"]) | (User.username == acc["username"]))
        res = await session.execute(stmt)
        existing = res.scalar_one_or_none()

        if not existing:
            new_user = User(
                username=acc["username"],
                email=acc["email"],
                name=acc["name"],
                role=acc["role"],
                avatar=acc["avatar"],
                hashed_password=get_password_hash(acc["password"]),
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            session.add(new_user)
            logger.info(f"Seeded demo account into MySQL: {acc['email']} ({acc['username']})")
    
    await session.commit()


async def seed_default_excipients(session: AsyncSession):
    """Seed 20 essential pharmaceutical excipients into MySQL."""
    default_excipients = [
        {
            "name": "Microcrystalline Cellulose (MCC PH-102)",
            "category": "binder",
            "function": "Direct compression binder, tablet diluent, disintegrant filler",
            "max_recommended_concentration_pct": 90.0,
            "ph_stability_min": 5.0,
            "ph_stability_max": 7.5,
            "known_incompatibilities": ["Strong oxidizing agents"],
            "molecular_weight": 34000.0,
            "description": "Purified, partially depolymerized cellulose with exceptional compressibility and hardness properties.",
        },
        {
            "name": "Polysorbate 80 (Tween 80)",
            "category": "surfactant",
            "function": "Non-ionic solubilizer, micellar emulsifier, wetting agent",
            "max_recommended_concentration_pct": 10.0,
            "ph_stability_min": 5.0,
            "ph_stability_max": 8.0,
            "known_incompatibilities": [
                "Phenols",
                "Tannins",
                "Trace peroxides oxidizing thiols/phenols",
            ],
            "molecular_weight": 1310.0,
            "description": "Hydrophilic polyoxyethylene sorbitan ester widely used for solubilizing lipophilic BCS Class II/IV drugs.",
        },
        {
            "name": "Magnesium Stearate",
            "category": "lubricant",
            "function": "Hydrophobic boundary lubricant for tablet punch and die walls",
            "max_recommended_concentration_pct": 2.0,
            "ph_stability_min": 6.5,
            "ph_stability_max": 8.5,
            "known_incompatibilities": [
                "Strong acids",
                "Alkalies",
                "Carboxylic acids (forms insoluble magnesium salts)",
            ],
            "molecular_weight": 591.24,
            "description": "Metallic salt lubricant that reduces friction during tablet compression but may delay drug dissolution if overdosed.",
        },
        {
            "name": "PEG 400 (Polyethylene Glycol 400)",
            "category": "solvent",
            "function": "Hydrophilic cosolvent, viscosity modifier, plasticizer",
            "max_recommended_concentration_pct": 30.0,
            "ph_stability_min": 4.5,
            "ph_stability_max": 7.5,
            "known_incompatibilities": [
                "Penicillins",
                "Bacitracin",
                "Oxidizable thiols/phenols via residual peroxides",
            ],
            "molecular_weight": 400.0,
            "description": "Low-molecular-weight polyether liquid used to enhance aqueous solubility of poorly soluble drugs.",
        },
        {
            "name": "Ethanol (Absolute)",
            "category": "solvent",
            "function": "Cosolvent, permeation enhancer, antimicrobial preservative",
            "max_recommended_concentration_pct": 20.0,
            "ph_stability_min": 4.0,
            "ph_stability_max": 9.0,
            "known_incompatibilities": ["Strong oxidizing agents", "Strong alkali metals"],
            "molecular_weight": 46.07,
            "description": "Volatile polar organic solvent used in oral solutions, tinctures, and specialized parenteral co-solvent systems.",
        },
        {
            "name": "Citric Acid Monohydrate",
            "category": "buffer",
            "function": "Acidulant, biological buffer component, metal chelating agent",
            "max_recommended_concentration_pct": 5.0,
            "ph_stability_min": 1.5,
            "ph_stability_max": 6.5,
            "known_incompatibilities": [
                "Potassium tartrate",
                "Alkali carbonates",
                "Bicarbonates",
                "Acetates",
            ],
            "molecular_weight": 210.14,
            "description": "Tricarboxylic organic acid used to control formulation microenvironmental pH and sequester heavy metal ions.",
        },
        {
            "name": "Hydroxypropyl Methylcellulose (HPMC E5)",
            "category": "binder",
            "function": "Film-former, tablet coating polymer, hydrophilic matrix binder",
            "max_recommended_concentration_pct": 40.0,
            "ph_stability_min": 3.0,
            "ph_stability_max": 11.0,
            "known_incompatibilities": ["Strong oxidizing agents"],
            "molecular_weight": 10000.0,
            "description": "Semi-synthetic, inert, viscoelastic cellulose ether used extensively in immediate and sustained-release oral systems.",
        },
        {
            "name": "Phospholipon 90G",
            "category": "lipid",
            "function": "Phospholipid bilayer matrix, liposome vesicle former, LNP component",
            "max_recommended_concentration_pct": 25.0,
            "ph_stability_min": 5.5,
            "ph_stability_max": 7.5,
            "known_incompatibilities": [
                "Extreme pH causes ester hydrolysis",
                "Unprotected oxidation",
            ],
            "molecular_weight": 760.0,
            "description": "High-purity soybean phosphatidylcholine (>94%) ideal for parenteral liposomes, lipid nanoparticles, and nano-emulsions.",
        },
        {
            "name": "Lactose Monohydrate (Fast Flo)",
            "category": "filler",
            "function": "Direct compression tablet filler, capsule diluent",
            "max_recommended_concentration_pct": 80.0,
            "ph_stability_min": 4.0,
            "ph_stability_max": 7.0,
            "known_incompatibilities": [
                "Primary amines (Maillard reaction)",
                "Secondary amines",
                "Strong oxidizers",
            ],
            "molecular_weight": 360.31,
            "description": "Standard reducing disaccharide diluent; contraindicated with primary amine APIs due to Maillard browning.",
        },
        {
            "name": "Croscarmellose Sodium (Ac-Di-Sol)",
            "category": "disintegrant",
            "function": "Cross-linked superdisintegrant, rapid water uptake & wicking agent",
            "max_recommended_concentration_pct": 5.0,
            "ph_stability_min": 5.0,
            "ph_stability_max": 7.0,
            "known_incompatibilities": ["Strong acids", "Soluble iron salts"],
            "molecular_weight": 90000.0,
            "description": "Cross-linked polymer of sodium carboxymethylcellulose facilitating rapid disintegration within 30-60 seconds.",
        },
        {
            "name": "Povidone K30 (PVP)",
            "category": "binder",
            "function": "Wet granulation binder, crystallization inhibitor, solubilizer",
            "max_recommended_concentration_pct": 15.0,
            "ph_stability_min": 3.0,
            "ph_stability_max": 7.0,
            "known_incompatibilities": [
                "Sulfathiazole",
                "Sodium salicylate",
                "Salicylic acid",
                "Phenobarbital",
            ],
            "molecular_weight": 50000.0,
            "description": "Synthetic polymer forming water-soluble complexes and inhibiting recrystallization of amorphous solid dispersions.",
        },
        {
            "name": "Propylene Glycol",
            "category": "solvent",
            "function": "Hydrophilic cosolvent, humectant, antimicrobial stabilizer",
            "max_recommended_concentration_pct": 40.0,
            "ph_stability_min": 3.0,
            "ph_stability_max": 7.0,
            "known_incompatibilities": [
                "Potassium permanganate",
                "Strong oxidizing agents",
            ],
            "molecular_weight": 76.09,
            "description": "Clear, viscous diol solvent extensively utilized in oral, topical, and parenteral drug formulations.",
        },
        {
            "name": "Sodium Lauryl Sulfate (SLS)",
            "category": "surfactant",
            "function": "Anionic surfactant, wetting agent, tablet lubricant aid",
            "max_recommended_concentration_pct": 2.5,
            "ph_stability_min": 6.0,
            "ph_stability_max": 8.0,
            "known_incompatibilities": [
                "Cationic surfactants",
                "Quaternary ammonium APIs",
                "Polyvalent metal ions",
            ],
            "molecular_weight": 288.38,
            "description": "Potent anionic detergent and wetting agent used in low concentrations to lower interfacial tension.",
        },
        {
            "name": "Mannitol",
            "category": "filler",
            "function": "Non-reducing sugar diluent, osmotic agent, lyophilization matrix",
            "max_recommended_concentration_pct": 80.0,
            "ph_stability_min": 4.5,
            "ph_stability_max": 7.5,
            "known_incompatibilities": ["Iron infusions (forms soluble chelates)"],
            "molecular_weight": 182.17,
            "description": "Non-hygroscopic sugar alcohol suitable as a safe non-reducing alternative to lactose for amine-containing APIs.",
        },
        {
            "name": "D-alpha-Tocopheryl PEG 1000 Succinate (TPGS)",
            "category": "surfactant",
            "function": "Non-ionic polymeric surfactant, P-gp efflux pump inhibitor, lipid stabilizer",
            "max_recommended_concentration_pct": 10.0,
            "ph_stability_min": 4.5,
            "ph_stability_max": 7.5,
            "known_incompatibilities": [
                "Strong acids/bases (hydrolyzes succinate ester)",
            ],
            "molecular_weight": 1513.0,
            "description": "Water-soluble derivative of Vitamin E that enhances oral bioavailability of BCS Class II/IV compounds.",
        },
        {
            "name": "Cholesterol (Plant-derived)",
            "category": "lipid",
            "function": "Membrane rigidity modulator for liposomes and lipid nanoparticles",
            "max_recommended_concentration_pct": 15.0,
            "ph_stability_min": 4.5,
            "ph_stability_max": 8.0,
            "known_incompatibilities": ["Strong oxidizing agents", "Photo-oxidation"],
            "molecular_weight": 386.65,
            "description": "Essential structural component in liposomes and LNPs that reduces bilayer permeability and prevents payload leakage.",
        },
        {
            "name": "Lecithin (Soy/Egg)",
            "category": "lipid",
            "function": "Natural emulsifier, liposomal vesicle former, dispersion stabilizer",
            "max_recommended_concentration_pct": 20.0,
            "ph_stability_min": 5.0,
            "ph_stability_max": 7.5,
            "known_incompatibilities": [
                "Hydrolyzed by strong acids/bases",
                "Oxidation",
            ],
            "molecular_weight": 750.0,
            "description": "Naturally occurring mixture of diglycerides of fatty acids linked to choline phosphate esters.",
        },
        {
            "name": "Sodium Starch Glycolate (Explotab)",
            "category": "disintegrant",
            "function": "Superdisintegrant via rapid swelling mechanism",
            "max_recommended_concentration_pct": 8.0,
            "ph_stability_min": 3.0,
            "ph_stability_max": 7.5,
            "known_incompatibilities": [
                "Ascorbic acid",
                "Strong acids reduce swelling capacity",
            ],
            "molecular_weight": 100000.0,
            "description": "Cross-linked potato starch derivative that absorbs up to 300 times its volume in water.",
        },
        {
            "name": "Tromethamine (Tris Buffer)",
            "category": "buffer",
            "function": "Biological alkalizing buffer, counter-ion salt former",
            "max_recommended_concentration_pct": 3.0,
            "ph_stability_min": 7.0,
            "ph_stability_max": 9.2,
            "known_incompatibilities": [
                "Strong acids",
                "Copper",
                "Aluminum",
            ],
            "molecular_weight": 121.14,
            "description": "Organic primary amine buffer widely employed in injectable biologic and small-molecule formulations.",
        },
        {
            "name": "Benzyl Alcohol",
            "category": "stabilizer",
            "function": "Antimicrobial preservative, local anesthetic cosolvent",
            "max_recommended_concentration_pct": 2.0,
            "ph_stability_min": 5.0,
            "ph_stability_max": 8.0,
            "known_incompatibilities": [
                "Methylcellulose",
                "Strong oxidizers",
                "Strong acids",
            ],
            "molecular_weight": 108.14,
            "description": "Aromatic alcohol preservative used in multi-dose parenteral and topical drug products.",
        },
    ]

    for exc_data in default_excipients:
        stmt = select(Excipient).where(Excipient.name == exc_data["name"])
        res = await session.execute(stmt)
        existing = res.scalar_one_or_none()

        if not existing:
            new_exc = Excipient(
                name=exc_data["name"],
                category=exc_data["category"],
                function=exc_data["function"],
                max_recommended_concentration_pct=exc_data["max_recommended_concentration_pct"],
                ph_stability_min=exc_data["ph_stability_min"],
                ph_stability_max=exc_data["ph_stability_max"],
                known_incompatibilities=exc_data["known_incompatibilities"],
                molecular_weight=exc_data.get("molecular_weight"),
                description=exc_data.get("description"),
                created_at=datetime.now(timezone.utc),
            )
            session.add(new_exc)
            logger.info(f"Seeded excipient into MySQL: {exc_data['name']} ({exc_data['category']})")
    
    await session.commit()


async def close_db():
    """Dispose of SQLAlchemy async engine on shutdown."""
    logger.info("Disposing of MySQL engine pool...")
    await engine.dispose()
    logger.info("MySQL connection pool closed.")
