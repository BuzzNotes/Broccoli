const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase configuration for project broccoli-452000
const firebaseConfig = {
  apiKey: "AIzaSyCC1RNORXgRcT82vA8cQ6axBW047w3BBDA",
  authDomain: "broccoli-452000.firebaseapp.com",
  projectId: "broccoli-452000",
  storageBucket: "broccoli-452000.appspot.com",
  messagingSenderId: "1079081190424",
  appId: "1:1079081190424:web:9fee6afd2bdee2dd762f6d",
  measurementId: "G-DKPEER8WNF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Initialize Firestore collections with sample data
 */
async function initializeFirestore() {
  try {
    console.log('Starting Firestore initialization...');

    // Create a sample user document
    const sampleUserId = 'sample-user-123';
    await setDoc(doc(db, 'users', sampleUserId), {
      firstName: 'Sample',
      lastName: 'User',
      email: 'sample@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Created sample user document');

    // Create a sample post
    const samplePostId = 'sample-post-123';
    await setDoc(doc(db, 'posts', samplePostId), {
      userId: sampleUserId,
      title: 'Welcome to Broccoli',
      content: 'This is a sample post to initialize the posts collection.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Created sample post document');

    // Create a sample comment
    const sampleCommentId = 'sample-comment-123';
    await setDoc(doc(db, 'comments', sampleCommentId), {
      userId: sampleUserId,
      postId: samplePostId,
      content: 'This is a sample comment to initialize the comments collection.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Created sample comment document');

    // Create a user collection document
    await setDoc(doc(db, `users/${sampleUserId}/collections`, 'favorites'), {
      name: 'Favorites',
      description: 'Favorite items',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Created sample user collection document');

    console.log('Firestore initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
}

// Run the initialization
initializeFirestore(); 