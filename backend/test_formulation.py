"""
Comprehensive Automated Test Suite for Module 1: Formulation Builder.
Tests excipients catalog, RDKit SMILES parsing, SMARTS substructure alerts,
chemical incompatibility rules, delivery vehicle physiological checks,
and formulation persistence in MongoDB.
"""

import httpx
import sys

BASE_URL = "http://localhost:8000/api"

def run_formulation_tests():
    print("🧪 Starting Module 1: Formulation Builder Test Suite...\n")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # Authenticate user to get JWT Bearer token
    print("[Setup] Authenticating test user...")
    login_res = client.post("/auth/login", json={
        "identifier": "admin@example.com",
        "password": "password123",
    })
    assert login_res.status_code == 200, f"Authentication failed: {login_res.text}"
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Authenticated as {login_res.json()['user']['name']}\n")

    # =========================================================================
    # Test 1: List Excipients Catalog
    # =========================================================================
    print("[Test 1] GET /api/formulation/excipients...")
    res = client.get("/formulation/excipients")
    assert res.status_code == 200, f"Failed to get excipients: {res.text}"
    excipients = res.json()
    assert len(excipients) >= 15, f"Expected at least 15 excipients, got {len(excipients)}"
    print(f"✅ Retrieved {len(excipients)} pharmaceutical excipients from MongoDB.")

    # Test category filter
    res_surfactants = client.get("/formulation/excipients?category=surfactant")
    assert res_surfactants.status_code == 200
    surfactants = res_surfactants.json()
    assert len(surfactants) >= 2, "Expected surfactants to be filtered"
    for s in surfactants:
        assert s["category"] == "surfactant"
    print(f"✅ Filtered {len(surfactants)} surfactants (e.g. {surfactants[0]['name']}).")

    # =========================================================================
    # Test 2: Invalid SMILES String Handling
    # =========================================================================
    print("\n[Test 2] POST /api/formulation/validate with Malformed SMILES...")
    res = client.post("/formulation/validate", json={
        "api_name": "Broken Drug Molecule",
        "api_smiles": "INVALID_SMILES_XYZ_12345",
        "delivery_vehicle": "oral_tablet",
        "target_dose_mg": 50.0,
        "target_ph": 7.0,
        "excipients": [{"excipient_name": "Microcrystalline Cellulose (MCC PH-102)", "concentration_pct": 50.0}]
    })
    assert res.status_code == 200
    val_data = res.json()
    assert val_data["is_valid"] is False
    assert any(flag["code"] == "INVALID_SMILES" for flag in val_data["compatibility_flags"])
    print("✅ Malformed SMILES correctly caught and flagged as invalid.")

    # =========================================================================
    # Test 3: Chemical Substructure Detection (Aspirin - Ester & Carboxylic Acid)
    # =========================================================================
    print("\n[Test 3] POST /api/formulation/validate for Aspirin (CC(=O)Oc1ccccc1C(=O)O)...")
    aspirin_smiles = "CC(=O)Oc1ccccc1C(=O)O"
    res = client.post("/formulation/validate", json={
        "api_name": "Aspirin (Acetylsalicylic Acid)",
        "api_smiles": aspirin_smiles,
        "delivery_vehicle": "oral_tablet",
        "target_dose_mg": 100.0,
        "target_ph": 6.8,
        "excipients": [
            {"excipient_name": "Microcrystalline Cellulose (MCC PH-102)", "concentration_pct": 60.0},
            {"excipient_name": "Magnesium Stearate", "concentration_pct": 1.0},
            {"excipient_name": "Croscarmellose Sodium (Ac-Di-Sol)", "concentration_pct": 4.0},
        ]
    })
    assert res.status_code == 200
    val_data = res.json()
    props = val_data["physicochemical_properties"]
    assert 179.0 <= props["molecular_weight"] <= 181.0, f"Expected MW ~180.16, got {props['molecular_weight']}"
    assert any("Ester" in g for g in val_data["detected_api_functional_groups"]), "Ester not detected"
    assert any("Carboxylic Acid" in g for g in val_data["detected_api_functional_groups"]), "Carboxylic acid not detected"
    print(f"✅ Aspirin Properties Computed: MW={props['molecular_weight']}, LogP={props['logp']}, TPSA={props['tpsa']}")
    print(f"✅ Functional Groups Detected: {val_data['detected_api_functional_groups']}")
    print(f"✅ BCS Prediction: {val_data['bcs_solubility_flag']}")

    # =========================================================================
    # Test 4: Critical Incompatibility - Maillard Reaction (Primary Amine + Lactose)
    # =========================================================================
    print("\n[Test 4] Primary Amine + Lactose Monohydrate (Maillard Browning Alert)...")
    # Amoxicillin contains primary aliphatic amine: CC1(C(N2C(S1)C(C2=O)NC(=O)C(c3ccc(cc3)O)N)C(=O)O)C
    amoxicillin_smiles = "CC1(C(N2C(S1)C(C2=O)NC(=O)C(c3ccc(cc3)O)N)C(=O)O)C"
    res = client.post("/formulation/validate", json={
        "api_name": "Amoxicillin Trihydrate",
        "api_smiles": amoxicillin_smiles,
        "delivery_vehicle": "oral_tablet",
        "target_dose_mg": 500.0,
        "target_ph": 6.0,
        "excipients": [
            {"excipient_name": "Lactose Monohydrate (Fast Flo)", "concentration_pct": 45.0},
            {"excipient_name": "Magnesium Stearate", "concentration_pct": 1.0}
        ]
    })
    assert res.status_code == 200
    val_data = res.json()
    assert val_data["is_valid"] is False, "Maillard incompatibility should mark is_valid as False"
    maillard_flag = next((f for f in val_data["compatibility_flags"] if f["code"] == "MAILLARD_REACTION_ALERT"), None)
    assert maillard_flag is not None, "MAILLARD_REACTION_ALERT must be triggered"
    assert maillard_flag["severity"] == "critical"
    print(f"✅ Critical Alert Triggered: {maillard_flag['message']}")

    # =========================================================================
    # Test 5: Delivery Vehicle Violation - IV Infusion with Acidic pH (pH 3.5)
    # =========================================================================
    print("\n[Test 5] IV Infusion with Unacceptable pH (pH 3.5)...")
    res = client.post("/formulation/validate", json={
        "api_name": "Ciprofloxacin Solution",
        "api_smiles": "C1CC1N2C=C(C(=O)C3=CC(=C(C=C32)N4CCNCC4)F)C(=O)O",
        "delivery_vehicle": "iv_infusion",
        "target_dose_mg": 200.0,
        "target_ph": 3.5,  # Unacceptable for IV
        "excipients": [
            {"excipient_name": "Citric Acid Monohydrate", "concentration_pct": 2.0}
        ]
    })
    assert res.status_code == 200
    val_data = res.json()
    assert val_data["is_valid"] is False
    iv_ph_flag = next((f for f in val_data["compatibility_flags"] if f["code"] == "IV_PH_VIOLATION"), None)
    assert iv_ph_flag is not None, "IV_PH_VIOLATION flag must be triggered"
    print(f"✅ Critical IV Constraint Triggered: {iv_ph_flag['message']}")

    # =========================================================================
    # Test 6: Excipient Concentration Limit Overload
    # =========================================================================
    print("\n[Test 6] Excipient Concentration Limit Overload (Magnesium Stearate 8.0%)...")
    res = client.post("/formulation/validate", json={
        "api_name": "Ibuprofen",
        "api_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
        "delivery_vehicle": "oral_tablet",
        "target_dose_mg": 400.0,
        "target_ph": 6.5,
        "excipients": [
            {"excipient_name": "Magnesium Stearate", "concentration_pct": 8.0}, # Max recommended is 2.0%
            {"excipient_name": "Microcrystalline Cellulose (MCC PH-102)", "concentration_pct": 50.0}
        ]
    })
    assert res.status_code == 200
    val_data = res.json()
    conc_flag = next((f for f in val_data["compatibility_flags"] if f["code"] == "EXCIPIENT_CONCENTRATION_EXCEEDED"), None)
    assert conc_flag is not None, "EXCIPIENT_CONCENTRATION_EXCEEDED must be triggered"
    print(f"✅ Concentration Overload Flagged: {conc_flag['message']}")

    # =========================================================================
    # Test 7: Valid Lipid Nanoparticle Formulation & Database Persistence
    # =========================================================================
    print("\n[Test 7] POST /api/formulation/save for Lipid Nanoparticle Formulation...")
    paclitaxel_smiles = "CC1=C2C(C(=O)C3(C(CC4C(C3C(C(C2(C)C)(CC1OC(=O)C(C(C5=CC=CC=C5)NC(=O)C6=CC=CC=C6)O)O)OC(=O)C7=CC=CC=C7)(CO4)OC(=O)C)O)C)OC(=O)C"
    save_payload = {
        "api_name": "Paclitaxel (Liposomal)",
        "api_smiles": paclitaxel_smiles,
        "delivery_vehicle": "liposome",
        "target_dose_mg": 30.0,
        "target_ph": 7.4,
        "excipients": [
            {"excipient_name": "Phospholipon 90G", "concentration_pct": 15.0},
            {"excipient_name": "Cholesterol (Plant-derived)", "concentration_pct": 5.0},
            {"excipient_name": "D-alpha-Tocopheryl PEG 1000 Succinate (TPGS)", "concentration_pct": 3.0}
        ],
        "notes": "Targeted anti-neoplastic liposomal stealth formulation."
    }

    res_save = client.post("/formulation/save", json=save_payload, headers=auth_headers)
    assert res_save.status_code == 201, f"Failed to save formulation: {res_save.text}"
    saved_form = res_save.json()
    form_id = saved_form["id"]
    assert saved_form["is_valid"] is True
    assert saved_form["api_name"] == "Paclitaxel (Liposomal)"
    print(f"✅ Formulation saved successfully with ID: {form_id}")

    # =========================================================================
    # Test 8: Retrieve User Formulations List & Single Document
    # =========================================================================
    print("\n[Test 8] GET /api/formulation/my-formulations & GET /api/formulation/{id}...")
    res_list = client.get("/formulation/my-formulations", headers=auth_headers)
    assert res_list.status_code == 200
    my_forms = res_list.json()
    assert len(my_forms) >= 1, "Expected at least 1 saved formulation"
    assert any(f["id"] == form_id for f in my_forms)
    print(f"✅ Retrieved {len(my_forms)} saved formulation(s) for user.")

    res_single = client.get(f"/formulation/{form_id}", headers=auth_headers)
    assert res_single.status_code == 200
    assert res_single.json()["id"] == form_id
    print(f"✅ Single formulation document verified: {res_single.json()['api_name']}")

    # =========================================================================
    # Test 9: Delete Formulation
    # =========================================================================
    print(f"\n[Test 9] DELETE /api/formulation/{form_id}...")
    res_del = client.delete(f"/formulation/{form_id}", headers=auth_headers)
    assert res_del.status_code == 200
    print(f"✅ Deleted formulation: {res_del.json()['message']}")

    print("\n🎉 ALL MODULE 1 FORMULATION BUILDER TESTS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    run_formulation_tests()
