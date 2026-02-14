from fastapi.testclient import TestClient

from backend.main import app


def test_index_page_serves_html():
    client = TestClient(app)
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")
