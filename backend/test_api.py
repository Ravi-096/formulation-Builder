import httpx
import sys

BASE_URL = "http://localhost:8000/api"

def run_tests():
    print("🚀 Starting Backend E2E API Verification...")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # 1. Test registration password complexity failure
    print("\n[Test 1] Register with weak password (missing uppercase & special char)...")
    res = client.post("/auth/register", json={
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "simplepassword",
        "confirm_password": "simplepassword"
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 422, f"Expected 422 validation error, got {res.status_code}"
    print("✅ Password complexity validation correctly rejected weak password.")

    # 2. Test registration success with strong password
    test_email = "alex.developer@enterprise.com"
    test_username = "alex_dev"
    test_password = "SecurePassword123!"

    print(f"\n[Test 2] Register with valid user: {test_username} ({test_email})...")
    # Clean up any previous test user or handle 409
    res = client.post("/auth/register", json={
        "email": test_email,
        "username": test_username,
        "password": test_password,
        "confirm_password": test_password,
        "name": "Alex Developer"
    })
    print(f"Status: {res.status_code}")
    if res.status_code == 409:
        print("User already exists from previous run, proceeding to login.")
    else:
        assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}: {res.text}"
        reg_data = res.json()
        assert "token" in reg_data or "access_token" in reg_data
        print(f"✅ Registration succeeded! User created with ID: {reg_data['user']['id']}")

    # 3. Test duplicate email registration
    print("\n[Test 3] Register duplicate email...")
    res = client.post("/auth/register", json={
        "email": test_email,
        "username": f"{test_username}_duplicate",
        "password": test_password,
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 409, f"Expected 409 Conflict, got {res.status_code}"
    print("✅ Duplicate email correctly rejected with 409 Conflict.")

    # 4. Test login via Email
    print("\n[Test 4] Login via Email...")
    res = client.post("/auth/login", json={
        "identifier": test_email,
        "password": test_password,
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
    login_data = res.json()
    auth_token = login_data["access_token"]
    print("✅ Email login successful! JWT Token acquired.")

    # 5. Test login via Username
    print("\n[Test 5] Login via Username...")
    res = client.post("/auth/login", json={
        "identifier": test_username,
        "password": test_password,
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    print("✅ Username login successful!")

    # 6. Test protected route: /api/auth/me
    print("\n[Test 6] Fetch profile GET /api/auth/me with Bearer token...")
    auth_headers = {"Authorization": f"Bearer {auth_token}"}
    res = client.get("/auth/me", headers=auth_headers)
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
    profile_data = res.json()
    assert profile_data["user"]["username"] == test_username
    assert profile_data["user"]["email"] == test_email
    assert "hashed_password" not in profile_data["user"]
    print(f"✅ Profile verified: {profile_data['user']['name']} ({profile_data['user']['email']})")

    # 7. Test unauthenticated request to protected route
    print("\n[Test 7] Access GET /api/auth/me WITHOUT token...")
    res = client.get("/auth/me")
    print(f"Status: {res.status_code}")
    assert res.status_code == 401, f"Expected 401 Unauthorized, got {res.status_code}"
    print("✅ Unauthorized request successfully rejected.")

    # 8. Test protected route: /api/dashboard/stats
    print("\n[Test 8] Fetch dashboard metrics GET /api/dashboard/stats...")
    res = client.get("/dashboard/stats", headers=auth_headers)
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    stats_data = res.json()
    assert "stats" in stats_data
    print(f"✅ Dashboard stats received: {list(stats_data['stats'].keys())}")

    # 9. Test protected route: /api/dashboard/recent-activity
    print("\n[Test 9] Fetch recent activity GET /api/dashboard/recent-activity...")
    res = client.get("/dashboard/recent-activity", headers=auth_headers)
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    activity_data = res.json()
    assert len(activity_data["activities"]) > 0
    print(f"✅ Recent activity list received: {len(activity_data['activities'])} audit logs")

    # 10. Test protected route: /api/dashboard/analytics
    print("\n[Test 10] Fetch analytics GET /api/dashboard/analytics...")
    res = client.get("/dashboard/analytics", headers=auth_headers)
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    analytics_data = res.json()
    assert "weeklyTraffic" in analytics_data["analytics"]
    print("✅ Analytics telemetry received successfully.")

    print("\n🎉 ALL 10 BACKEND VERIFICATION TESTS PASSED! 🎉\n")

if __name__ == "__main__":
    run_tests()
