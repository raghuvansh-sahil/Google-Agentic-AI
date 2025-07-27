import sqlite3

def initialise_categorized_spending():
    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()
    
    cursor.execute('DROP TABLE IF EXISTS categorized_spending')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categorized_spending (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            total_spending REAL
        )
    ''')

    connection.commit()

def populate_categorized_spending(gemini_model):
    categorized_spending = {}

    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()

    cursor.execute('SELECT id FROM receipts')
    table = cursor.fetchall()
    for row in table:
        id = row[0]
        cursor.execute('SELECT item_name, total FROM items WHERE receipt_id = ?', (id,))
        items = cursor.fetchall()
        for item in items:
            item_name = item[0]
            total = item[1]

            prompt = f'''Categorize the following item from a receipt into one of these categories: 
            groceries, entertainment, hygiene, dining out, transportation, utilities, clothing, housing, health, education, miscellaneous. 
            Item name: {item_name}
            '''
            response = gemini_model.generate_content(prompt)
            category = response.text.strip().lower()

            if 'groceries' in category:
                category = 'groceries'
            elif 'entertainment' in category:
                category = 'entertainment'
            elif 'hygiene' in category:
                category = 'hygiene'
            elif 'dining out' in category:
                category = 'dining out'
            elif 'transportation' in category:
                category = 'transportation'
            elif 'utilities' in category:
                category = 'utilities'
            elif 'clothing' in category:
                category = 'clothing'
            elif 'housing' in category:
                category = 'housing'
            elif 'health' in category:
                category = 'health'
            elif 'education' in category:
                category = 'education'
            else:
                category = 'miscellaneous'

            if category in categorized_spending:
                categorized_spending[category] += total if total is not None else 0.0
            else:
                categorized_spending[category] = total if total is not None else 0.0

    
    cursor = connection.cursor()
    for category, total_spending in categorized_spending.items():
        cursor.execute('''
            INSERT INTO categorized_spending (category, total_spending)
            VALUES (?, ?)
        ''', (category, total_spending))

    connection.commit()

def get_categorized_spending():
    categorized_spending = {}

    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()

    cursor.execute('SELECT category, total_spending FROM categorized_spending')
    table = cursor.fetchall()
    for row in table:
        categorized_spending[row[0]] = row[1]
    
    return categorized_spending
    