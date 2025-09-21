import React from 'react';

const teamMembers = [
  {
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+1 234 567 8901',
    address: '123 Main St, City, Country',
  },
  {
    name: 'Jane Smith',
    email: 'janesmith@example.com',
    phone: '+1 987 654 3210',
    address: '456 Elm St, City, Country',
  },

];

const Contact = () => {
  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Team Contact Details</h2>
      {teamMembers.map((member, idx) => (
        <div key={idx} style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: idx !== teamMembers.length - 1 ? '1px solid #eee' : 'none' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Name:</strong> {member.name}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Email:</strong> {member.email}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Phone:</strong> {member.phone}
          </div>
          <div>
            <strong>Address:</strong> {member.address}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Contact;