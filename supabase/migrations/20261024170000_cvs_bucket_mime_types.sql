-- Allow identity images and Word uploads in the private cvs bucket (preview route serves correct Content-Type).
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/octet-stream'
]
where id = 'cvs';
