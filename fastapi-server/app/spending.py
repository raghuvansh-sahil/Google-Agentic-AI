import sqlite3

def spending_per_day():
    daily_spendings = {}

    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()

    cursor.execute('SELECT date, total FROM receipts')
    table = cursor.fetchall()
    for row in table:
        date = row[0]
        total = row[1]
        if date:
            if date in daily_spendings:
                daily_spendings[date] += total
            else:
                daily_spendings[date] = total
    return daily_spendings

def spending_per_month():
    monthly_spendings = {}

    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()

    cursor.execute('SELECT date, total FROM receipts')
    table = cursor.fetchall()
    for row in table:
        date = row[0]
        total = row[1]
        if date:
            parts = date.split('-')
            month = f'{parts[1]}-{parts[2]}'
            if month in monthly_spendings:
                monthly_spendings[month] += total
            else:
                monthly_spendings[month] = total
    return monthly_spendings

def spending_per_year():
    yearly_spendings = {}

    connection = sqlite3.connect('receipts.db')
    cursor = connection.cursor()

    cursor.execute('SELECT date, total FROM receipts')
    table = cursor.fetchall()
    for row in table:
        date = row[0]
        total = row[1]
        if date:
            parts = date.split('-')
            year = f'{parts[2]}'
            if year in yearly_spendings:
                yearly_spendings[year] += total
            else:
                yearly_spendings[year] = total
    return yearly_spendings