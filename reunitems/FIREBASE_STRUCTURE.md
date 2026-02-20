# Firebase Firestore Structure Documentation

This document describes the Firebase Firestore database structure implemented in the ReunItems application.

## Database Structure

### Top-Level Collections

#### 1. Organizations (Collection)
- **Purpose**: Represents schools/organizations that use the platform
- **Document ID**: Auto-generated (ORG_REF_ID)
- **Fields**:
  - `name` (string): Organization name
  - `createdAt` (timestamp): Creation timestamp

**Subcollections:**
- `Locations` - Campus locations for lost & found items
- `Items` - Lost items found at this organization
- `Members` - Users who belong to this organization
- `Requests` - Missing item reports

#### 2. Users (Collection)
- **Purpose**: User accounts (linked to Firebase Auth)
- **Document ID**: Firebase Auth UID (USER_REF_ID)
- **Fields**:
  - `UserName` (string): Display name
  - `UserEmail` (string): Email address
  - `createdAt` (timestamp): Account creation timestamp

**Subcollections:**
- `MyApplications` - Applications to join organizations

#### 3. Claims (Collection)
- **Purpose**: Item claims made by users
- **Document ID**: Auto-generated (CLAIM_REF_ID)
- **Fields**:
  - `ClaimRef` (reference): Reference to Organizations/{orgId}/Items/{itemId}
  - `ClaimUser` (reference): Reference to Users/{userId}
  - `ClaimEvidence` (string): Proof/evidence provided
  - `ClaimAnswer` (string): Admin response/status
  - `createdAt` (timestamp): Claim timestamp

### Subcollections

#### Organizations/{orgId}/Locations
- **Purpose**: Physical locations on campus where items can be found
- **Document ID**: Auto-generated (LOC_REF_ID)
- **Fields**:
  - `LocName` (string): Location name (e.g., "Main Entrance", "Gym")
  - `LocDesc` (string): Optional description
  - `LocPoint` (geopoint): Geographic coordinates (latitude, longitude)
  - `createdAt` (timestamp): Creation timestamp

#### Organizations/{orgId}/Items
- **Purpose**: Lost items found at this organization
- **Document ID**: Auto-generated (ITEM_REF_ID)
- **Fields**:
  - `ItemName` (string): Item name/description
  - `ItemDesc` (string): Detailed description
  - `ItemLoc` (reference): Reference to Organizations/{orgId}/Locations/{locationId}
  - `ItemImg` (string): Image URL (optional)
  - `ItemTime` (timestamp): When item was found
  - `HideQuestion` (string): Security question (optional)
  - `HideAnswer` (string): Security answer (optional)
  - `createdAt` (timestamp): Creation timestamp
  - `createdBy` (string): User ID who added the item

#### Organizations/{orgId}/Members
- **Purpose**: Users who belong to this organization
- **Document ID**: Auto-generated (MEMBER_REF_ID)
- **Fields**:
  - `UserRef` (reference): Reference to Users/{userId}
  - `UserRole` (string): "admin" or "regular"
  - `ApplicationStatus` (string): "pending", "approved", or "denied"
  - `createdAt` (timestamp): Membership creation timestamp

#### Organizations/{orgId}/Requests
- **Purpose**: Missing item reports submitted by users
- **Document ID**: Auto-generated (REQ_REF_ID)
- **Fields**:
  - `ItemName` (string): Name of missing item
  - `ItemDesc` (string): Description/details
  - `createdAt` (timestamp): Request timestamp

#### Users/{userId}/MyApplications
- **Purpose**: Applications made by this user to join organizations
- **Document ID**: Auto-generated (APP_REF_ID)
- **Fields**:
  - `AppOrg` (reference): Reference to Organizations/{orgId}
  - `AppMember` (reference): Reference to Organizations/{orgId}/Members/{memberId}
  - `createdAt` (timestamp): Application timestamp

## Implementation Details

### Helper Functions

All database operations are handled through helper functions in `/lib/firebaseHelpers.ts`:

- `getOrganization(orgId)` - Get organization details
- `getLocations(orgId)` - Get all locations for an organization
- `addLocation(orgId, locationData)` - Add a new location
- `getItems(orgId)` - Get all items for an organization
- `addItem(orgId, itemData)` - Add a new item
- `getMembers(orgId)` - Get all members of an organization
- `getMemberByUser(orgId, userId)` - Get member record for a user
- `getClaimsByItem(itemRef)` - Get claims for a specific item
- `addClaim(claimData)` - Create a new claim
- `getUserOrganizations(userId)` - Get all organizations a user belongs to

### Authentication Flow

1. User signs up/logs in via Firebase Auth
2. User document is created/updated in `Users` collection
3. For admins: Organization is created in `Organizations` collection
4. Member record is created in `Organizations/{orgId}/Members` with role "admin"
5. Organization ID is stored in localStorage as `currentOrgId`

### Key Features

1. **Location Management**: Admins can plot locations on a map at `/admin/locations`
2. **Item Management**: Items are added with references to locations
3. **Claims System**: Users can claim items, which creates records in the top-level `Claims` collection
4. **Multi-Organization Support**: Users can belong to multiple organizations

## Migration Notes

- Old `schools` collection → New `Organizations` collection
- Old `memberships` collection → New `Organizations/{orgId}/Members` subcollection
- Old `items` collection → New `Organizations/{orgId}/Items` subcollection
- Old `claims` collection → Still top-level but uses references to new structure
- Old `locations` collection → New `Organizations/{orgId}/Locations` subcollection

## Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /Users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Organizations
    match /Organizations/{orgId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)).data.UserRole == 'admin';
      
      // Locations
      match /Locations/{locationId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          exists(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)).data.UserRole == 'admin';
      }
      
      // Items
      match /Items/{itemId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          exists(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)).data.UserRole == 'admin';
      }
      
      // Members
      match /Members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          exists(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid)).data.UserRole == 'admin';
      }
      
      // Requests
      match /Requests/{requestId} {
        allow read: if request.auth != null && 
          exists(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid));
        allow create: if request.auth != null && 
          exists(/databases/$(database)/documents/Organizations/$(orgId)/Members/$(request.auth.uid));
      }
    }
    
    // Claims
    match /Claims/{claimId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.ClaimUser == /databases/$(database)/documents/Users/$(request.auth.uid);
    }
  }
}
```

## Next Steps

1. Set up Firebase project and configure environment variables
2. Create Firestore database with the structure above
3. Set up Firebase Storage for item images
4. Configure security rules
5. Test all CRUD operations
6. Implement map feature for viewing items at locations (pending)
