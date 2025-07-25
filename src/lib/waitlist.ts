import { MongoClient } from 'mongodb';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

const waitlistDbUri = 'mongodb+srv://southcircleandco:eD3t14Y3OtZpp5Ws@waitlist.kh2fkme.mongodb.net/test?retryWrites=true&w=majority&appName=Waitlist';
const waitlistDbName = 'test';

// This function connects to the external waitlist DB, finds reviews by email,
// and copies them to the main application DB for the new user.
export async function migrateWaitlistReviews(newUser: User) {
  const client = new MongoClient(waitlistDbUri);

  try {
    await client.connect();
    const db = client.db(waitlistDbName);
    
    // Assuming waitlist reviews are in a collection named 'reviews'
    const waitlistReviewsCollection = db.collection('reviews'); 
    
    const waitlistReviews = await waitlistReviewsCollection.find({ 
      // Assuming the reviews are linked by an 'email' field
      email: newUser.email 
    }).toArray();

    if (waitlistReviews.length === 0) {
      console.log(`No waitlist reviews found for ${newUser.email}`);
      return;
    }

    console.log(`Found ${waitlistReviews.length} waitlist reviews for ${newUser.email}. Migrating...`);

    const reviewsToCreate = waitlistReviews.map(review => ({
      userId: newUser.id,
      title: review.title || 'Untitled Review',
      content: review.content || '',
      tags: review.tags || '',
      location: review.location || '',
      star: review.star || 0,
      isAnonymous: review.isAnonymous || false,
      userName: newUser.name,
      userAvatar: newUser.image,
      // Map other fields as necessary
    }));

    await prisma.review.createMany({
      data: reviewsToCreate,
    });

    console.log(`Successfully migrated ${reviewsToCreate.length} reviews for user ${newUser.id}.`);

  } catch (error) {
    console.error(`Failed to migrate waitlist reviews for user ${newUser.id}:`, error);
    // We don't throw an error here because failing to migrate old reviews
    // should not block the user's registration process.
  } finally {
    await client.close();
  }
}
