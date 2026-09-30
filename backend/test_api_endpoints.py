import asyncio
import httpx
from app.main import app

async def test_all_endpoints():
    print("🚀 Testing live FastAPI endpoints with local MySQL & SciPy PK simulator...")
    
    # Use ASGITransport to test app directly in-memory without needing external network port
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("✅ 1. Health check passed:", res.json())

        # 2. Excipients list from MySQL
        res = await client.get("/api/formulation/excipients")
        assert res.status_code == 200, f"Excipients failed: {res.text}"
        excipients = res.json()
        assert len(excipients) == 20, f"Expected 20 excipients, got {len(excipients)}"
        print(f"✅ 2. Excipients API passed: retrieved {len(excipients)} excipients from MySQL.")

        # 3. Excipients filter by category
        res = await client.get("/api/formulation/excipients?category=binder")
        assert res.status_code == 200
        binders = res.json()
        assert len(binders) > 0
        print(f"✅ 3. Filtered excipients API passed: {len(binders)} binders retrieved.")

        # 4. Formulation Validation with RDKit
        ibuprofen_payload = {
            "api_name": "Ibuprofen",
            "api_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
            "delivery_vehicle": "oral_tablet",
            "target_dose_mg": 400.0,
            "target_ph": 6.5,
            "excipients": [
                {"excipient_name": "Microcrystalline Cellulose (MCC PH-102)", "concentration_pct": 55.0},
                {"excipient_name": "Croscarmellose Sodium (Ac-Di-Sol)", "concentration_pct": 4.0},
                {"excipient_name": "Magnesium Stearate", "concentration_pct": 1.0}
            ]
        }
        res = await client.post("/api/formulation/validate", json=ibuprofen_payload)
        assert res.status_code == 200, f"Validation failed: {res.text}"
        val_data = res.json()
        assert val_data["is_valid"] is True
        props = val_data["physicochemical_properties"]
        print(f"✅ 4. RDKit validation API passed: MW={props['molecular_weight']}, LogP={props['logp']}, BCS={val_data['bcs_solubility_flag']}")

        # 5. SciPy Pharmacokinetics ODE Simulation
        pk_payload = {
            "api_name": "Ibuprofen",
            "api_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
            "delivery_vehicle": "oral_tablet",
            "route": "oral",
            "dose_mg_kg": 20.0,
            "animal_key": "dog",
            "hours": 48.0,
            "excipients": ibuprofen_payload["excipients"],
            "physicochemical_properties": props,
            "bcs_class": val_data["bcs_solubility_flag"]
        }
        res = await client.post("/api/formulation/simulate-pk", json=pk_payload)
        assert res.status_code == 200, f"PK Simulation failed: {res.text}"
        pk_data = res.json()
        metrics = pk_data["metrics"]
        print(f"✅ 5. SciPy PK ODE solver API passed:")
        print(f"    - Cmax: {metrics['cMax']} µg/mL at Tmax: {metrics['tMax']} h")
        print(f"    - AUC(0-48h): {metrics['auc']} µg·h/mL, t1/2: {metrics['tHalf']} h")
        print(f"    - Bioavailability: {metrics['bioavailabilityPct']}%, Time in Window: {metrics['pctInWindow']}%")
        assert len(pk_data["timeSeries"]) > 100

        # 6. Save Formulation to MySQL
        save_payload = {
            **ibuprofen_payload,
            "animal_key": "dog",
            "dose_mg_kg": 20.0,
            "notes": "Verified preclinical dog formulation in MySQL.",
            "pk_simulation": pk_data
        }
        res = await client.post("/api/formulation/save", json=save_payload)
        assert res.status_code == 201, f"Save formulation failed: {res.text}"
        saved = res.json()
        form_id = saved["id"]
        print(f"✅ 6. Save formulation to MySQL passed: ID={form_id}")

        # 7. Get My Formulations from MySQL
        res = await client.get("/api/formulation/my-formulations")
        assert res.status_code == 200
        my_forms = res.json()
        assert any(f["id"] == form_id for f in my_forms)
        print(f"✅ 7. Retrieve my formulations passed: found {len(my_forms)} saved formulations.")

        # 8. Delete Formulation from MySQL
        res = await client.delete(f"/api/formulation/{form_id}")
        assert res.status_code == 200
        print(f"✅ 8. Delete formulation passed: {res.json()['message']}")

    print("\n🎉 ALL API ENDPOINTS VERIFIED AND PASSING WITH LOCAL MYSQL!")

if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
