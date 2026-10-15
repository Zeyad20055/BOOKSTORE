// Usage:  npm run seed            (sample books + first admin)
//         npm run seed -- --books-only | --admin-only
// Safe to run many times: existing books/admins are never duplicated or overwritten.
import readline from 'node:readline';
import mongoose from 'mongoose';
import { env } from './env.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
const b = (title, author, category, price, stock, isbn, description) => ({ title, author, category, price, stock, isbn, coverUrl: cover(isbn), description });

const BOOKS = [
  b('The Great Gatsby', 'F. Scott Fitzgerald', 'Classics', 12.99, 25, '9780743273565', 'Nick Carraway watches his mysterious neighbour Jay Gatsby chase an impossible dream through the glittering, hollow parties of 1920s Long Island.'),
  b('Pride and Prejudice', 'Jane Austen', 'Classics', 9.99, 30, '9780141439518', 'Elizabeth Bennet and the proud Mr Darcy trade wit, misjudgements and slow-burning affection in Austen\'s sharpest comedy of manners.'),
  b('Jane Eyre', 'Charlotte Brontë', 'Classics', 10.5, 18, '9780141441146', 'An orphaned governess finds love and a terrible secret at Thornfield Hall, and refuses to give up her independence for either.'),
  b('Crime and Punishment', 'Fyodor Dostoevsky', 'Classics', 13.75, 14, '9780143107637', 'A impoverished student commits a murder he believes is justified, then unravels under guilt in this landmark psychological novel.'),
  b('1984', 'George Orwell', 'Fiction', 11.99, 40, '9780451524935', 'In a world of constant surveillance and rewritten history, Winston Smith risks everything for a private thought and a forbidden love.'),
  b('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 13.99, 22, '9780061120084', 'Scout Finch grows up in Depression-era Alabama while her father defends a Black man falsely accused of a crime.'),
  b('The Alchemist', 'Paulo Coelho', 'Fiction', 14.5, 35, '9780062315007', 'A young Andalusian shepherd follows a recurring dream to the Egyptian pyramids and learns to listen to his own heart.'),
  b('The Catcher in the Rye', 'J. D. Salinger', 'Fiction', 10.99, 12, '9780316769488', 'Holden Caulfield wanders New York for three days after leaving prep school, restless, funny and quietly heartbroken.'),
  b('The Hobbit', 'J. R. R. Tolkien', 'Science Fiction & Fantasy', 14.99, 28, '9780547928227', 'Bilbo Baggins leaves his comfortable hole in the ground to help thirteen dwarves reclaim their mountain home from a dragon.'),
  b('Dune', 'Frank Herbert', 'Science Fiction & Fantasy', 16.99, 20, '9780441013593', 'On the desert planet Arrakis, young Paul Atreides is pulled into a struggle over the universe\'s most valuable substance.'),
  b('Brave New World', 'Aldous Huxley', 'Science Fiction & Fantasy', 12.49, 16, '9780060850524', 'A engineered society trades freedom for comfort and stability, until one outsider refuses to play along.'),
  b('Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 18.99, 32, '9780062316110', 'A sweeping history of humankind, from the first stone tools to the cognitive, agricultural and scientific revolutions.'),
  b('Educated', 'Tara Westover', 'Non-Fiction', 15.99, 24, '9780399590504', 'A memoir of a girl raised by survivalists in rural Idaho who teaches herself enough to reach university and then Cambridge.'),
  b('Atomic Habits', 'James Clear', 'Self-Help', 17.99, 50, '9780735211292', 'A practical system for building good habits and breaking bad ones through small, consistent changes in identity and environment.'),
  b('Thinking, Fast and Slow', 'Daniel Kahneman', 'Self-Help', 16.5, 19, '9780374533557', 'A Nobel laureate explains the two systems that drive our thinking and the predictable errors each one makes.'),
  b('A Brief History of Time', 'Stephen Hawking', 'Science', 14.25, 17, '9780553380163', 'From the Big Bang to black holes, a clear guide to the biggest questions in cosmology for readers without a physics degree.'),
  b('Cosmos', 'Carl Sagan', 'Science', 15.5, 11, '9780345539434', 'A lyrical tour of the universe and humanity\'s place in it, tracing how curiosity built modern astronomy.'),
  b('Clean Code', 'Robert C. Martin', 'Technology', 39.99, 15, '9780132350884', 'A handbook of agile software craftsmanship on naming, functions, tests and refactoring code that other people can read.'),
  b('The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 'Technology', 44.99, 3, '9780135957059', 'Timeless, practical advice on becoming a more effective and adaptable developer, updated for the 20th anniversary.'),
  b('Designing Data-Intensive Applications', 'Martin Kleppmann', 'Technology', 49.99, 0, '9781449373320', 'The principles behind reliable, scalable and maintainable data systems, from storage engines to distributed consensus.'),
];

const args = new Set(process.argv.slice(2));
const doBooks = !args.has('--admin-only');
const doAdmin = !args.has('--books-only');

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    }
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(answer.trim()); });
  });
}

async function seedBooks() {
  let added = 0;
  for (const book of BOOKS) {
    if (await Book.exists({ title: book.title, author: book.author })) continue;
    await Book.create(book);
    added++;
  }
  console.log(`[seed] Books: ${added} added, ${BOOKS.length - added} already present`);
}

async function seedAdmin() {
  let name = process.env.ADMIN_NAME;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (password === 'change_this_password') password = '';
  if ((!email || !password) && process.stdin.isTTY) {
    console.log('[seed] No ADMIN_EMAIL / ADMIN_PASSWORD in server/.env, starting interactive setup.');
    name = name || (await ask('Admin name: '));
    email = email || (await ask('Admin email: '));
    password = password || (await ask('Admin password (min 8 chars): ', { hidden: true }));
  }
  if (!email || !password) {
    console.log('[seed] Admin skipped: set ADMIN_EMAIL and ADMIN_PASSWORD (a real password) in server/.env and run "npm run seed" again.');
    return;
  }
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('ADMIN_EMAIL is not a valid email address');
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin: ${email} already exists (role: ${existing.role}), nothing changed. Passwords are never overwritten.`);
    return;
  }
  await User.create({ name: (name || 'Store Admin').trim(), email, password, role: 'admin' });
  console.log(`[seed] Admin created: ${email}`);
}

try {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`[seed] Connected to MongoDB (${mongoose.connection.name})`);
  if (doBooks) await seedBooks();
  if (doAdmin) await seedAdmin();
} catch (err) {
  console.error(`[seed] Failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
