import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Wir speichern die Datei im Projekt-Hauptverzeichnis
const dataFilePath = path.join(process.cwd(), 'dictionary.json');

// Hilfsfunktion zum Lesen der JSON-Datei
function getDictionary() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Fehler beim Lesen der dictionary.json:', error);
    return [];
  }
}

// Hilfsfunktion zum Speichern der JSON-Datei
function saveDictionary(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Fehler beim Schreiben der dictionary.json:', error);
    return false;
  }
}

// GET: Liefert alle Wörter zurück
export async function GET() {
  const dictionary = getDictionary();
  return NextResponse.json(dictionary);
}

// POST: Fügt ein neues Wortpaar hinzu
export async function POST(request) {
  try {
    const body = await request.json();
    const { tunisian, german, notes } = body;

    if (!tunisian || !german) {
      return NextResponse.json({ error: 'Tunesisch und Deutsch sind erforderlich' }, { status: 400 });
    }

    const dictionary = getDictionary();
    
    // Einfache ID-Generierung
    const newId = (dictionary.length > 0 ? Math.max(...dictionary.map(item => parseInt(item.id) || 0)) + 1 : 1).toString();
    
    const newItem = {
      id: newId,
      tunisian: tunisian.trim(),
      german: german.trim(),
      notes: notes ? notes.trim() : ''
    };

    dictionary.push(newItem);
    const success = saveDictionary(dictionary);

    if (success) {
      return NextResponse.json(newItem, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
}
