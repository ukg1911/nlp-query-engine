-- Create the departments table
CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(255) NOT NULL,
    manager_id INTEGER
);

-- Create the employees table
CREATE TABLE employees (
    emp_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    annual_salary NUMERIC(10, 2),
    join_date DATE,
    office_location VARCHAR(255),
    dept_id INTEGER,
    CONSTRAINT fk_department
        FOREIGN KEY(dept_id)
        REFERENCES departments(dept_id)
);

-- Insert data into departments
INSERT INTO departments (dept_name, manager_id) VALUES
('Engineering', 1),
('Sales', 2),
('Human Resources', 3),
('Marketing', 4);

-- Insert data into employees
INSERT INTO employees (full_name, dept_id, position, annual_salary, join_date, office_location) VALUES
('John Smith', 1, 'Senior Python Developer', 120000.00, '2021-05-10', 'New York'),
('Jane Doe', 1, 'Software Engineer', 95000.00, '2022-08-15', 'San Francisco'),
('Peter Jones', 1, 'Data Scientist', 110000.00, '2020-11-01', 'New York'),
('Alice Williams', 2, 'Sales Manager', 105000.00, '2019-07-22', 'Chicago'),
('Michael Brown', 2, 'Sales Associate', 70000.00, '2023-01-30', 'Chicago'),
('Emily Davis', 3, 'HR Manager', 90000.00, '2018-03-12', 'New York'),
('David Miller', 4, 'Marketing Lead', 85000.00, '2022-10-20', 'San Francisco');

-- Set the managers after employees have been inserted
UPDATE departments SET manager_id = 1 WHERE dept_name = 'Engineering';
UPDATE departments SET manager_id = 4 WHERE dept_name = 'Sales';