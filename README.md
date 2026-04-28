# mystarting.link

mystarting.link - simple, private start page.
• No tracking, no analytics
• All settings stored local-first
- Export/Import local settings
- Cloud syning (Supabase backend) with E2EE
- IPFS syncing with E2EE
• Themes and Walpapers
• Favorites, Tasks, Notes
• Weather by wttr.in


## Screenshot
![screenshot](https://github.com/etcSudoers/mystarting.link/blob/main/imgs/example.png)


## Selfhost

### Deploy
Code is simple index file with some CSS and JS.  Point any webserver at it -- Even `python3 -m http.server` is enough.

### Supabase 
If you wish to run your own supabase deployment..
1.  Create a new supabase project, and email auth.
2.  Modify the supabase JS file headers to add your supabase location and public key. 
3.  Create a table called `user_blobs` with the right permissions  You can use this sql code here:
Create the table:
```sql
create table user_blobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  encrypted_data text,
  updated_at timestamp with time zone default now()
);
```
Enable Row Level Security:
```sql
alter table user_blobs enable row level security;
```
Policies:
```sql
-- Select own data
create policy "Users can read own blob"
on user_blobs
for select
using (auth.uid() = user_id);

-- Insert own data
create policy "Users can insert own blob"
on user_blobs
for insert
with check (auth.uid() = user_id);

-- Update own data
create policy "Users can update own blob"
on user_blobs
for update
using (auth.uid() = user_id);
```
Enforce one login per row:
```sql
alter table user_blobs
add constraint one_blob_per_user unique (user_id);
```
```
```
```
```
```
```
```
