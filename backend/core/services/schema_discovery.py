from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import SQLAlchemyError

class SchemaDiscovery:
    """
    Connects to a database and automatically discovers its schema,
    including tables, columns, data types, and relationships.
    """
    def analyze_database(self, connection_string: str) -> dict:
        """
        Analyzes the database schema from a given connection string.

        Args:
            connection_string: The database connection string provided by the user.

        Returns:
            A dictionary representing the discovered schema, or an error dictionary.
        """
        if not connection_string:
            return {"error": "Connection string cannot be empty."}

        try:
            # Create a database engine from the connection string
            engine = create_engine(connection_string)
            # Create an inspector object to explore the database
            inspector = inspect(engine)
            
            schema_info = {"tables": []}
            table_names = inspector.get_table_names()

            for table_name in table_names:
                table_info = {
                    "name": table_name,
                    "columns": [],
                    "foreign_keys": []
                }
                
                # Get the primary key constraint for the current table
                pk_constraint = inspector.get_pk_constraint(table_name)
                primary_key_columns = pk_constraint.get('constrained_columns', [])

                # Get all columns for the current table
                columns = inspector.get_columns(table_name)
                for column in columns:
                    is_primary = column['name'] in primary_key_columns
                    table_info["columns"].append({
                        "name": column['name'],
                        "type": str(column['type']),
                        "is_primary_key": is_primary
                    })

                # Get all foreign keys for the current table
                foreign_keys = inspector.get_foreign_keys(table_name)
                for fk in foreign_keys:
                    table_info["foreign_keys"].append({
                        "constrained_columns": fk['constrained_columns'],
                        "referred_table": fk['referred_table'],
                        "referred_columns": fk['referred_columns']
                    })
                
                schema_info["tables"].append(table_info)
            
            return schema_info

        except SQLAlchemyError as e:
            # Handle specific database connection or inspection errors
            return {"error": f"Database connection or inspection failed: {str(e)}"}
        except Exception as e:
            # Handle any other unexpected errors
            return {"error": f"An unexpected error occurred: {str(e)}"}

