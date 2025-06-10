// functions/index.js

// Import the v2 function trigger we need directly
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {generateSubstrings} = require("./helpers");

// Initialize Firebase SDK
admin.initializeApp();

/**
 * This single function handles create, update, and delete events for routines.
 * It uses the modern v2 syntax for Cloud Functions.
 */
exports.updateSearchIndex = onDocumentWritten("Routines/{routineId}",
    async (event) => {
      // onDocumentWritten provides a single `event` object.

      // If the document was deleted, there's nothing to index.
      if (!event.data.after.exists) {
        return null;
      }

      // Get the data from the document that was written.
      const workoutData = event.data.after.data();
      const workoutId = event.params.routineId;

      // Create a Set to hold all unique searchable terms.
      const searchableTerms = new Set();

      // 1. Add substrings from the workout title.
      if (workoutData.title) {
        const titleSubstrings = generateSubstrings(workoutData.title);
        titleSubstrings.forEach((term) => searchableTerms.add(term));
      }

      // 2. Add substrings from each exercise name.
      if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
        workoutData.exercises.forEach((exercise) => {
          if (exercise.name) {
            const exerciseSubstrings = generateSubstrings(exercise.name);
            exerciseSubstrings.forEach((term) => searchableTerms.add(term));
          }
        });
      }

      // Convert the Set to an array.
      const searchIndex = Array.from(searchableTerms);

      // Get a reference to the document that was written.
      const docRef = admin.firestore().collection("Routines").doc(workoutId);

      try {
        // Update the document with the new searchIndex field.
        // Using { merge: true } ensures we only add/update this one field
        // without overwriting other data.
        await docRef.set({searchIndex: searchIndex}, {merge: true});
        console.log(`Successfully updated 
            search index for workout: ${workoutId}`);
      } catch (error) {
        console.error(`Error updating search index for workout: 
        ${workoutId}`, error);
      }

      return null;
    });
