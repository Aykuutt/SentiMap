-- Antigravity Database Schema
-- Compatible with PostgreSQL and SQLite

DROP TABLE IF EXISTS sentiment_analyses CASCADE;
DROP TABLE IF EXISTS visited_places CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
-- Stores credentials and roles for both customers (B2C) and business managers (B2B)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'business')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUSINESSES TABLE
-- Stores dining profile information, coordinates, and ownership linking to users
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. REVIEWS TABLE
-- Stores ratings and textual reviews submitted by customers for dining places
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VISITED PLACES TABLE
-- Tracks customer-specific saved/visited history logs
CREATE TABLE visited_places (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, business_id)
);

-- 5. SENTIMENT ANALYSES TABLE
-- Stores AI-generated sentiment scores, label outcomes, and dynamic administrative action suggestions
CREATE TABLE sentiment_analyses (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    sentiment_label VARCHAR(15) NOT NULL CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
    action_suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
