from app.main import app


def test_openapi_contains_core_routes() -> None:
    paths = app.openapi()["paths"]
    assert "/api/v1/found-items" in paths
    assert "/api/v1/found-items/{item_id}" in paths
    assert "/api/v1/lost-items" in paths
    assert "/api/v1/lost-items/{item_id}" in paths
    assert "/api/v1/lost-items/map" in paths
    assert "/api/v1/admin/login" in paths
    assert "/api/v1/match-results" in paths
    assert "/api/v1/match-results/generate/{lost_item_id}" in paths
    assert "/api/v1/match-results/generate/found/{found_item_id}" in paths
    assert "/api/v1/match-results/{lost_item_id}/{found_item_id}/confirm" in paths
    assert "/api/v1/uploads/images" in paths


def test_delete_routes_require_admin_bearer_auth() -> None:
    paths = app.openapi()["paths"]
    assert paths["/api/v1/found-items/{item_id}"]["delete"]["security"] == [{"HTTPBearer": []}]
    assert paths["/api/v1/lost-items/{item_id}"]["delete"]["security"] == [{"HTTPBearer": []}]
