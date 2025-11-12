# Design Document

## Overview

I would not say the functionality of my app has conceptually changed significantly since Assignment 2. I did well with limiting the scope of my app early on; notably, I omitted an entire feature, and looking back, finishing this app would have been near impossible if I did include it.

However, I can still recount a few changes:

## 1. Concept Design: Files

I always had intended to display images like you would expect of a classic social media app, but I did not anticipate back during Assignment 2 that it would essentially require implementing another concept, which is called “File” in my backend.

Luckily, I saw a Piazza post from Sinjin who similarly required files for their project, and they gave a good list of pointers that I was able to feed to LLMs to implement with minimal obstacles.

## 2. Syncs

After reading grader comments on Assignment 2, I realized that I missed a large number of required syncs in Assignment 2. As my social media app revolves around authenticated users, almost all of the app’s actions would require a sync checking that the user was authenticated before proceeding, but I listed none of these syncs.

Thus, for Assignment 4, I made sure that all relevant actions had a user authentication condition.

## 3. Frontend Visuals

In Assignment 2, the UI sketches I provided were for if my app was a mobile app. This was my original intention since birding outside with a laptop is rather impractical, and my thoughts were to have bird logging utilize the camera feature of the phone rather than image uploading as you can see in my video demo.

As I had to work on a browser instead, there inevitably had to be some changes. There were also other changes in general. Here’s a list of the main ones:
* My UI sketches had buttons to switch between the different views of the app. The final version of my app displays this as tabs near the top of the webpage.
* I had originally planned to have friend requests and friends be displayed in different areas of the app, but I later changed it so that they appear in the same tab since it felt like it made sense to keep same-concept ideas together.
* I still wanted to retain the idea of a home feed and had to experiment around with a different appearance layouts since the original idea of following an Instagram-like style on mobile wasn't feasible. I wanted to choose a design that could condense posts well on the home feed to reduce clutter. Thus, I settled for having only one image per post display at a time (with a selector to flip through images) and set heights for the posts. If a post's height exceeded that set height, then a scrollbar would appear.
