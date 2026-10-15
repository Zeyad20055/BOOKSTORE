
import mongoose from 'mongoose';
import Book from './models/Book.js';
import 'dotenv/config';

const books = [
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'A practical guide to building good habits and breaking bad ones.',
    price: 350,
    category: 'Self Development',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    stock: 15,
    isbn: '9780735211292',
  },
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    description: 'Lessons about wealth, behavior, saving, and making better financial decisions.',
    price: 300,
    category: 'Finance',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg',
    stock: 12,
    isbn: '9780857197689',
  },
  {
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    description: 'A popular introduction to financial literacy and personal finance.',
    price: 280,
    category: 'Finance',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg',
    stock: 10,
    isbn: '9781612680194',
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    description: 'Principles and practices for writing readable and maintainable software.',
    price: 550,
    category: 'Programming',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
    stock: 8,
    isbn: '9780132350884',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas and Andrew Hunt',
    description: 'Practical techniques and principles for becoming a better programmer.',
    price: 600,
    category: 'Programming',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg',
    stock: 7,
    isbn: '9780135957059',
  },
  {
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    description: 'An introduction to JavaScript programming, from fundamentals to advanced concepts.',
    price: 450,
    category: 'Programming',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781593279509-L.jpg',
    stock: 9,
    isbn: '9781593279509',
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    description: 'Strategies for focused work and reducing distractions.',
    price: 320,
    category: 'Productivity',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
    stock: 11,
    isbn: '9781455586691',
  },
  {
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    description: 'A classic book about goal setting, persistence, and achievement.',
    price: 250,
    category: 'Personal Growth',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781585424337-L.jpg',
    stock: 14,
    isbn: '9781585424337',
  },
];

async function seedBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Skip books whose ISBN already exists to avoid duplicates.
    const existingISBNs = new Set(
      (
        await Book.find({
          isbn: { $in: books.map((book) => book.isbn) },
        }).select('isbn')
      ).map((book) => book.isbn)
    );

    const newBooks = books.filter((book) => !existingISBNs.has(book.isbn));

    if (newBooks.length === 0) {
      console.log('All 8 sample books already exist. Nothing was added.');
      return;
    }

    const inserted = await Book.insertMany(newBooks);

    console.log(`Successfully added ${inserted.length} books.`);
    console.log(`Skipped ${books.length - newBooks.length} existing books.`);
  } catch (error) {
    console.error('Failed to add books:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedBooks();
