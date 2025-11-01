import { assertEquals } from "@std/assert";
import { freshID, testDb } from "@utils/database.ts"; // Assuming @utils/database.ts provides testDb and freshID
import { ID } from "@utils/types.ts"; // Assuming @utils/types.ts provides ID

import PostingConcept from "./PostingConcept.ts";
import { AssertionError } from "node:assert";

Deno.test("Posting Concept Tests", async (t) => {
  const [db, client] = await testDb();
  const postingConcept = new PostingConcept(db);

  const userAlice = "user:Alice" as ID;
  const userBob = "user:Bob" as ID;
  // Images now represented as URL strings
  const image1 = "https://example.com/images/unsplash_abc1.jpg";
  const image2 = "https://example.com/images/unsplash_xyz2.jpg";
  const image3 = "https://example.com/images/unsplash_def3.jpg";

  await t.step(
    "Principle: Users can create, edit, and delete their posts",
    async () => {
      console.log("\n--- Principle Test: Create, Edit, Delete ---");

      // 1. User Alice creates a post
      const createResult = await postingConcept.create({
        user: userAlice,
        images: [image1, image2],
        caption: "My first post about nature!",
      });
      console.log(
        `Alice creates post: user=${userAlice}, images=[${image1}, ${image2}], caption='My first post about nature!' -> `,
        createResult,
      );

      if ("error" in createResult) {
        throw new AssertionError({
          message: "Create should not return an error",
        });
      }

      const postId = (createResult as { post: ID }).post;
      assertEquals(
        typeof postId,
        "string",
        "Created post ID should be a string",
      );

      // Verify post exists and has correct content
      const getPostResult1 = await postingConcept._getPostById({
        post: postId,
      });
      console.log(`Query post by ID ${postId}: `, getPostResult1);
      assertEquals(
        getPostResult1.error,
        undefined,
        "Query should not return an error for an existing post",
      );
      assertEquals(
        getPostResult1.postDetails?.length,
        1,
        "Should return exactly one post",
      );
      assertEquals(
        getPostResult1.postDetails?.[0]?.author, // Accessing the first element of the array
        userAlice,
        "Post author should be Alice",
      );
      assertEquals(
        getPostResult1.postDetails?.[0]?.caption, // Accessing the first element of the array
        "My first post about nature!",
        "Post caption mismatch",
      );
      assertEquals(
        getPostResult1.postDetails?.[0]?.images.length, // Accessing the first element of the array
        2,
        "Post should have 2 images",
      );

      // 2. User Alice edits the post's caption
      const newCaption = "";
      const editResult = await postingConcept.edit({
        user: userAlice,
        post: postId,
        new_caption: newCaption,
      });
      console.log(
        `Alice edits post ${postId}: user=${userAlice}, new_caption='${newCaption}' -> `,
        editResult,
      );
      assertEquals(
        editResult.error,
        undefined,
        "Edit should not return an error",
      );

      // Verify post's caption is updated
      const getPostResult2 = await postingConcept._getPostById({
        post: postId,
      });
      console.log(`Query post by ID ${postId} after edit: `, getPostResult2);
      assertEquals(
        getPostResult2.error,
        undefined,
        "Query after edit should not return an error",
      );
      assertEquals(
        getPostResult2.postDetails?.length,
        1,
        "Should return exactly one post after edit",
      );
      assertEquals(
        getPostResult2.postDetails?.[0]?.caption, // Accessing the first element of the array
        newCaption,
        "Post caption was not updated",
      );

      // 3. User Alice deletes the post
      const deleteResult = await postingConcept.delete({
        user: userAlice,
        post: postId,
      });
      console.log(
        `Alice deletes post ${postId}: user=${userAlice} -> `,
        deleteResult,
      );
      assertEquals(
        deleteResult.error,
        undefined,
        "Delete should not return an error",
      );

      // Verify post no longer exists using _getPostById, which should return an empty array
      const getPostResult3 = await postingConcept._getPostById({
        post: postId,
      });
      console.log(`Query post by ID ${postId} after delete: `, getPostResult3);
      assertEquals(
        getPostResult3.error,
        undefined, // _getPostById returns empty array for not found, not an error
        "Query for non-existent post should not return an error",
      );
      assertEquals(
        getPostResult3.postDetails?.length,
        0, // Expecting an empty array for postDetails
        "Post should no longer exist (query should return empty array)",
      );
    },
  );

  await t.step("Scenario: Invalid 'create' calls", async () => {
    console.log("\n--- Scenario: Invalid Create Calls ---");

    // Case 1: Create post with no images
    const createNoImagesResult = await postingConcept.create({
      user: userAlice,
      images: [],
      caption: "Post with no images",
    });
    console.log(
      `Alice tries to create post with no images: user=${userAlice}, images=[], caption='Post with no images' -> `,
      createNoImagesResult,
    );

    if (!("error" in createNoImagesResult)) {
      throw new AssertionError({
        message: "Create should return an error",
      });
    }

    assertEquals(
      createNoImagesResult.error,
      "Images cannot be empty for a post.",
      "Creating with no images should return an error",
    );

    // Case 3: Create post with no user ID
    const createNoUserResult = await postingConcept.create({
      user: "" as ID, // Invalid user ID
      images: [image1],
      caption: "Post by no user",
    });
    console.log(
      `Tries to create post with no user: user='', images=[${image1}], caption='Post by no user' -> `,
      createNoUserResult,
    );
    if (!("error" in createNoUserResult)) {
      throw new AssertionError({
        message: "Create should return an error",
      });
    }
    assertEquals(
      createNoUserResult.error,
      "User ID must be provided.",
      "Creating with no user ID should return an error",
    );
  });

  await t.step(
    "Scenario: Unauthorized 'delete' and 'edit' attempts",
    async () => {
      console.log("\n--- Scenario: Unauthorized Actions ---");

      // Alice creates a post for testing unauthorized actions
      const createResult = await postingConcept.create({
        user: userAlice,
        images: [image1],
        caption: "Alice's test post",
      });
      const alicePostId = (createResult as { post: ID }).post;
      console.log(`Alice creates test post ${alicePostId}: `, createResult);

      if ("error" in createResult) {
        throw new AssertionError({
          message: "Create should not return an error",
        });
      }

      // Case 1: Bob tries to delete Alice's post
      const bobDeleteResult = await postingConcept.delete({
        user: userBob,
        post: alicePostId,
      });
      console.log(
        `Bob tries to delete Alice's post ${alicePostId}: user=${userBob} -> `,
        bobDeleteResult,
      );
      assertEquals(
        bobDeleteResult.error,
        "Unauthorized: User is not the author of this post.",
        "Bob should not be able to delete Alice's post",
      );

      // Case 2: Bob tries to edit Alice's post
      const bobEditResult = await postingConcept.edit({
        user: userBob,
        post: alicePostId,
        new_caption: "Bob tries to change caption",
      });
      console.log(
        `Bob tries to edit Alice's post ${alicePostId}: user=${userBob}, new_caption='Bob tries to change caption' -> `,
        bobEditResult,
      );
      assertEquals(
        bobEditResult.error,
        "Unauthorized: User is not the author of this post.",
        "Bob should not be able to edit Alice's post",
      );

      // Clean up Alice's post
      await postingConcept.delete({ user: userAlice, post: alicePostId });
    },
  );

  await t.step("Scenario: Actions on non-existent posts", async () => {
    console.log("\n--- Scenario: Actions on Non-existent Posts ---");

    const nonExistentPostId = freshID();

    // Case 1: Delete a non-existent post
    const deleteNonExistentResult = await postingConcept.delete({
      user: userAlice,
      post: nonExistentPostId,
    });
    console.log(
      `Alice tries to delete non-existent post ${nonExistentPostId}: -> `,
      deleteNonExistentResult,
    );
    assertEquals(
      deleteNonExistentResult.error,
      `Post with ID '${nonExistentPostId}' not found.`,
      "Deleting non-existent post should return an error",
    );

    // Case 2: Edit a non-existent post
    const editNonExistentResult = await postingConcept.edit({
      user: userAlice,
      post: nonExistentPostId,
      new_caption: "Attempt to edit non-existent post",
    });
    console.log(
      `Alice tries to edit non-existent post ${nonExistentPostId}: -> `,
      editNonExistentResult,
    );
    assertEquals(
      editNonExistentResult.error,
      `Post with ID '${nonExistentPostId}' not found.`,
      "Editing non-existent post should return an error",
    );
  });

  await t.step(
    "Scenario: Multiple users and multiple posts, using queries",
    async () => {
      console.log("\n--- Scenario: Multiple Users and Posts ---");

      // Alice creates two posts
      const postA1Result = await postingConcept.create({
        user: userAlice,
        images: [image1],
        caption: "Alice's first post",
      });
      const postA1Id = (postA1Result as { post: ID }).post;
      console.log(`Alice creates post A1 (${postA1Id}): `, postA1Result);

      const postA2Result = await postingConcept.create({
        user: userAlice,
        images: [image2, image3],
        caption: "Alice's second post",
      });
      const postA2Id = (postA2Result as { post: ID }).post;
      console.log(`Alice creates post A2 (${postA2Id}): `, postA2Result);

      // Bob creates one post
      const postB1Result = await postingConcept.create({
        user: userBob,
        images: [image3],
        caption: "Bob's only post",
      });
      const postB1Id = (postB1Result as { post: ID }).post;
      console.log(`Bob creates post B1 (${postB1Id}): `, postB1Result);

      // Query for Alice's posts
      const alicePostsResult = await postingConcept._getPostsByAuthor({
        user: userAlice,
      });
      console.log(`Query posts by Alice (${userAlice}): `, alicePostsResult);
      assertEquals(
        alicePostsResult.error,
        undefined,
        "Query for Alice's posts should succeed",
      );
      assertEquals(
        alicePostsResult.posts?.length,
        2,
        "Alice should have 2 posts",
      );
      assertEquals(
        alicePostsResult.posts?.some((p) => p._id === postA1Id),
        true,
        "Alice's posts should include A1",
      );
      assertEquals(
        alicePostsResult.posts?.some((p) => p._id === postA2Id),
        true,
        "Alice's posts should include A2",
      );
      // Verify the order: postA2 should be first (most recent), then postA1 (older)
      assertEquals(
        alicePostsResult.posts?.[0]._id,
        postA2Id,
        "First post given in query should be Alice's second post (most recent)",
      );
      assertEquals(
        alicePostsResult.posts?.[1]._id,
        postA1Id,
        "Second post given in query should be Alice's first post (oldest)",
      );

      // Query for Bob's posts
      const bobPostsResult = await postingConcept._getPostsByAuthor({
        user: userBob,
      });
      console.log(`Query posts by Bob (${userBob}): `, bobPostsResult);
      assertEquals(
        bobPostsResult.error,
        undefined,
        "Query for Bob's posts should succeed",
      );
      assertEquals(bobPostsResult.posts?.length, 1, "Bob should have 1 post");
      assertEquals(
        bobPostsResult.posts?.some((p) => p._id === postB1Id),
        true,
        "Bob's posts should include B1",
      );

      // Query for a user with no posts
      const userCharlie = "user:Charlie" as ID;
      const charliePostsResult = await postingConcept._getPostsByAuthor({
        user: userCharlie,
      });
      console.log(
        `Query posts by Charlie (${userCharlie}): `,
        charliePostsResult,
      );
      assertEquals(
        charliePostsResult.error,
        undefined,
        "Query for Charlie's posts should succeed",
      );
      assertEquals(
        charliePostsResult.posts?.length,
        0,
        "Charlie should have 0 posts",
      );

      // Clean up
      await postingConcept.delete({ user: userAlice, post: postA1Id });
      await postingConcept.delete({ user: userAlice, post: postA2Id });
      await postingConcept.delete({ user: userBob, post: postB1Id });
    },
  );

  await client.close();
});
