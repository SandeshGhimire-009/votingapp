# Voting System Flow Guide

## Complete Systematic Flow

### 1️⃣ Admin Creates Contest

**Location**: Admin Panel → Contests → "Create Contest" button

**Steps**:

1. Click "Create Contest"
2. Fill in:
   - Contest Title (required)
   - Description (optional)
   - Start Date (required)
   - End Date (required - must be after start date)
3. Click "Create Contest"
4. Contest is created with status: **DRAFT** (voting disabled)

**Important**: At this stage, voting is NOT enabled. Users cannot vote yet.

---

### 2️⃣ Admin Adds Contestants

**Location**: Admin Panel → Contests → Select Contest → "View Contestants" or "Add Contestant"

**Steps**:

1. Find your contest in the list
2. Click "View" button or go to Contestants page
3. Add contestants (minimum 2 required to start voting)
4. For each contestant:
   - Name (required)
   - Description (optional)
   - Image (optional)

**Validation**: You need at least **2 contestants** before you can start voting.

---

### 3️⃣ Admin Starts Voting

**Location**: Admin Panel → Contests → Find Contest → "Start Voting" button

**Requirements Before Starting**:

- ✅ Contest must have at least 2 contestants
- ✅ Contest must not already be active

**Steps**:

1. Ensure contest has 2+ contestants (warning badge will show if not)
2. Click "Start Voting" button (green button with play icon)
3. Confirm the action
4. Contest status changes to: **ACTIVE** (voting enabled)
5. All users receive a notification that voting is open

**What Happens**:

- Contest status → Active
- Voting enabled → True
- Users can now see the contest in their voting page
- Users can select candidates and vote

---

### 4️⃣ Users Vote

**Location**: User Panel → Vote → Select Contest → Choose Candidate

**Steps**:

1. Navigate to Vote page
2. If multiple contests, select the active contest from dropdown
3. View available candidates
4. Click on a candidate to select them (checkmark will appear)
5. Click "Confirm Vote" button
6. In the modal:
   - Verify your selected candidate
   - Set confidence level (1-5 stars)
   - Click "Confirm"
7. Vote is recorded
8. User sees success message with Vote ID
9. User is redirected to dashboard

**Restrictions**:

- ❌ Cannot vote if voting not started by admin
- ❌ Cannot vote twice in the same contest
- ❌ Cannot vote if you're a contestant in that contest
- ❌ Cannot vote outside the voting window (if time limits are set)

---

### 5️⃣ Admin Monitors Voting

**Location**: Admin Panel → Contests or Results

**Features**:

- View real-time vote counts
- See total votes per contest
- Monitor contestant performance
- View voting logs and activities

**Admin Can**:

- Stop voting at any time (click "Stop Voting" button)
- View detailed results
- Check who voted (activity logs)

---

### 6️⃣ Admin Stops Voting & Publishes Results

**Location**: Admin Panel → Contests → "Stop Voting" or Results Page

**Steps**:

1. Click "Stop Voting" button (red button with stop icon)
2. Voting is disabled immediately
3. Users can no longer vote
4. Navigate to Results page to publish official results
5. Declare winner

---

## Quick Troubleshooting

### Issue: "Can't vote in contest"

**Cause**: Voting not started by admin
**Solution**: Admin must click "Start Voting" button first

### Issue: "Start Voting button is disabled"

**Cause**: Less than 2 contestants in the contest
**Solution**: Admin must add at least 2 contestants first

### Issue: "No contests showing in user vote page"

**Cause**: No active contests with voting enabled
**Solution**: Admin must create contest, add contestants, and start voting

### Issue: "Can't select candidate"

**Cause**: Voting window closed or not enabled
**Solution**: Check voting status banner at top of page

---

## Session Management (New Feature)

### Concurrent Admin & User Sessions

You can now open both admin and user panels simultaneously:

**How to Use**:

1. Open Browser 1 (e.g., Chrome) → Login as Admin
2. Open Browser 2 (e.g., Firefox) → Login as User
3. Both sessions work independently
4. Each session uses separate storage keys

**Login Behavior**:

- Admin users → Automatically redirected to `/admin/dashboard`
- Regular users → Automatically redirected to `/user/dashboard`

---

## Contest States

| State         | Status       | Voting Enabled | Users Can Vote |
| ------------- | ------------ | -------------- | -------------- |
| **DRAFT**     | Draft        | ❌ No          | ❌ No          |
| **ACTIVE**    | Active       | ✅ Yes         | ✅ Yes         |
| **STOPPED**   | Draft/Closed | ❌ No          | ❌ No          |
| **COMPLETED** | Closed       | ❌ No          | ❌ No          |

---

## Visual Indicators

### Admin Panel

- 🟢 **Green "Start Voting"** button: Ready to start (2+ contestants)
- 🔴 **Red "Stop Voting"** button: Currently active
- ⚠️ **Warning Badge**: Need more contestants
- 🔒 **Disabled Button**: Requirements not met

### User Panel

- ✅ **Green Status**: Voting is open
- ⏸️ **Yellow Status**: Voting not started
- 🔒 **Red Status**: Voting closed
- ✓ **Checkmark**: Selected candidate
- 🚫 **Disabled**: Cannot vote (various reasons)

---

## Best Practices

1. **Always add contestants before starting voting**
2. **Set realistic start/end dates**
3. **Test voting with a user account before going live**
4. **Monitor vote counts during active voting**
5. **Stop voting before publishing results**
6. **Use separate browsers for admin/user testing**

---

## Technical Notes

### Storage

- User sessions: `session-user-id`
- Admin sessions: `session-admin-id`
- Data stored in localStorage

### Validation

- Minimum 2 contestants required
- End date must be after start date
- One vote per user per contest
- Contestants cannot vote in their own contest

### Notifications

- Users notified when voting opens
- Users notified when voting closes
- Admin notified of contestant applications
