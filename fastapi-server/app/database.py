import sqlite3

def initialise_database():
    connection = sqlite3.connect('receipts.db')
    connection.execute('PRAGMA foreign_keys = ON')
    cursor = connection.cursor()

    cursor.execute(''' 
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_name TEXT,
            store_address TEXT,
            date TEXT,
            time TEXT,
            subtotal REAL,
            total REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER,
            item_name TEXT,
            quantity INTEGER,
            price REAL,
            total REAL,
            FOREIGN KEY(receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS taxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER,
            tax_name TEXT,
            percent REAL,
            amount REAL,
            FOREIGN KEY(receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
        )
    ''')

    connection.commit()
    return connection

def insert_receipt_inDB(receipt):
    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()
    
    cursor.execute('''
        INSERT INTO receipts (store_name, store_address, date, time, subtotal, total)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (receipt.get('store_name'), receipt.get('store_address'), receipt.get('date'), receipt.get('time'), receipt.get('subtotal'), receipt.get('total')))
    id = cursor.lastrowid
    for item in receipt.get('items', []):
        cursor.execute('''
            INSERT INTO items (receipt_id, item_name, quantity, price, total)
            VALUES (?, ?, ?, ?, ?)
        ''', (id, item.get('item_name'), item.get('quantity'), item.get('price'), item.get('total')))
    for tax in receipt.get('taxes', []):
        cursor.execute('''
            INSERT INTO taxes (receipt_id, tax_name, percent, amount)
            VALUES (?, ?, ?, ?)
        ''', (id, tax.get('tax_name'), tax.get('percent'), tax.get('amount')))
    
    connection.commit()
    print("Receipt successfully saved to the database.")

def get_receipts_fromDB():
    receipts = []
    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM receipts')
    table = cursor.fetchall()
    if table:
        for row in table:
            receipt = {
                "store_name": row[1],
                "store_address": row[2],
                "date": row[3],
                "time": row[4],
                "items": [],
                "subtotal": row[4],
                "taxes": [],
                "total": row[6]
            }
        
            id = row[0]
            cursor.execute('SELECT item_name, quantity, price, total FROM items WHERE receipt_id = ?', (id,))
            items = cursor.fetchall()
            for item in items:
                receipt["items"].append({
                    "item_name": item[0],
                    "quantity": item[1],
                    "price": item[2],
                    "total": item[3]
                })
            cursor.execute('SELECT tax_name, percent, amount FROM taxes WHERE receipt_id = ?', (id,))
            taxes = cursor.fetchall()
            for tax in taxes:
                receipt["taxes"].append({
                    "tax_name": tax[0],
                    "percent": tax[1],
                    "amount": tax[2]
                })
        
            receipts.append(receipt)
    
    return receipts