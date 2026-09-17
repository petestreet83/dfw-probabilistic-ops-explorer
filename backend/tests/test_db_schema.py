from app.db import get_connection, initialize_db


def test_schema_tables_exist(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("SQLITE_PATH", str(db_path))
    initialize_db()

    with get_connection() as conn:
        rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()

    names = {row[0] for row in rows}
    assert "weather_observations" in names
    assert "bts_flights" in names
    assert "source_cache_log" in names
