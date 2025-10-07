import pytest
from core.services.schema_discovery import SchemaDiscovery

def test_analyze_database_with_mocked_schema(mocker):
    """
    Unit Test for the SchemaDiscovery service.
    This test uses a "mock" to simulate a database inspector, allowing us to
    test the logic of the analyze_database function in isolation without a real database.
    
    """
    # 1. ARRANGE: Create mock objects to simulate the database inspector's behavior.
    mock_inspector = mocker.Mock()
    mock_inspector.get_table_names.return_value = ['employees']
    mock_inspector.get_columns.return_value = [
        {'name': 'emp_id', 'type': 'INTEGER'},
        {'name': 'full_name', 'type': 'VARCHAR'},
    ]
    mock_inspector.get_pk_constraint.return_value = {'constrained_columns': ['emp_id']}
    mock_inspector.get_foreign_keys.return_value = []

    # Patch the SQLAlchemy functions to return our mock inspector
    mocker.patch('core.services.schema_discovery.create_engine')
    mocker.patch('core.services.schema_discovery.inspect', return_value=mock_inspector)

    # 2. ACT: Call the function we want to test.
    discovery_service = SchemaDiscovery()
    result = discovery_service.analyze_database("mock_connection_string")

    # 3. ASSERT: Check if the output matches our expectations.
    assert "error" not in result
    assert len(result['tables']) == 1
    
    employees_table = result['tables'][0]
    assert employees_table['name'] == 'employees'
    assert len(employees_table['columns']) == 2
    assert employees_table['columns'][0]['name'] == 'emp_id'
    assert employees_table['columns'][0]['is_primary_key'] is True
    assert employees_table['columns'][1]['name'] == 'full_name'
    assert employees_table['columns'][1]['is_primary_key'] is False

def test_handles_empty_connection_string():
    """Tests that the service gracefully handles an empty connection string."""
    discovery_service = SchemaDiscovery()
    result = discovery_service.analyze_database("")
    assert "error" in result
    assert result["error"] == "Connection string cannot be empty."
