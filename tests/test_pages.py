from fastapi.testclient import TestClient

from backend.main import app


def test_index_page_serves_html():
    client = TestClient(app)
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")


def test_journal_page_serves_html():
    client = TestClient(app)
    res = client.get("/journal")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")

    res_with_trailing_slash = client.get("/journal/")
    assert res_with_trailing_slash.status_code == 200
    assert "text/html" in res_with_trailing_slash.headers.get("content-type", "")
