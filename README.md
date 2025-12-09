# **Echoes: Timișoara Digital Heritage Trail – Specification Draft**  
**by Abraham Paul and Boros Fabian**

---

## **General Description**
This application aims to help both visitors and local institutions by offering an accessible and interactive way to explore Timișoara’s cultural heritage. Using GPS-based discovery, multimedia content, and gamified exploration, the application enhances the tourism experience while supporting heritage preservation and public engagement.

The app functions as a **mobile-first Progressive Web Application (PWA)** that allows users to:
- discover historical locations  
- listen to audio stories  
- view archival images  
- track exploration progress  

---

## **Registration (Visitor & Admin)**
Users must register by selecting a role:
- **Visitor**
- **Administrator**

All users must provide:
- unique username  
- password  
- full name  
- preferred language  

Administrators must provide an **additional verification field** for access to management features.

---

## **Administrator Features**
After logging in, administrators can manage heritage locations.

### **Each heritage node must contain:**
- title  
- geographic coordinates (latitude, longitude)  
- proximity detection radius  
- category (architecture, monument, park, etc.)  
- historical description  
- primary image  
- *optional:* audio narration, additional images  

### **Administrators can also view:**
- list of user-submitted location requests  
- list of recent discoveries made by users  
- pending community photo uploads  

For each location request, administrators may:
- **accept** or **reject**  
- optionally add a rejection reason  

---

## **Visitor Features**
Visitors must log in to access the main functionalities.

### **1. Explore the Map**
Visitors can:
- view all heritage locations on an interactive map  
- search or filter by category  
- unlock location content automatically via GPS when approaching physically  

### **2. View Site Details**
Each heritage node provides:
- historical descriptions  
- archival images and user-submitted photos  
- multi-language audio stories  
- translations: **Romanian, Hungarian, English, German, French**

### **3. Discovery System**
Visitors can unlock a heritage site by approaching it (~50m radius).  
A discovery grants:
- points  
- progress updates  
- entry in discovery history  

### **4. Gamification & Social Features**
Visitors can:
- view leaderboard rankings  
- add friends and see their discoveries  
- track achievements and badges  

### **5. Route Planning**
Visitors can generate/customize routes based on:
- preferred categories  
- available visiting time  
- selected locations  

### **6. Order-Equivalent User History (Discovery History)**
Visitors can view all past discoveries, with:
- date of discovery  
- status (discovered / undiscovered)  
- points earned  
- viewed audio or images  
- audio playback duration (if applicable)  

### **7. Community Interaction**
Visitors may:
- submit new location requests  
- upload images for existing locations  
- view submission status: **accepted, rejected, pending**  
  - if rejected, the reason is shown  

---
