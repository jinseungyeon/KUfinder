from app.main import app


def test_openapi_contains_core_routes() -> None:
    paths = app.openapi()["paths"]
    assert "/api/v1/found-items" in paths
    assert "/api/v1/lost-items" in paths
    assert "/api/v1/match-results" in paths
    assert "/api/v1/match-results/generate/{lost_item_id}" in paths
    assert "/api/v1/uploads/images" in paths
