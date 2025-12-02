import React from 'react';
import styles from './Contact.module.css';

/**
 * Contact Component
 * Displays team contact information
 */
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
    <div className={styles.container}>
      <h2 className={styles.title}>Team Contact Details</h2>
      {teamMembers.map((member, idx) => (
        <div 
          key={idx} 
          className={`${styles.memberCard} ${idx !== teamMembers.length - 1 ? styles.memberCardBorder : ''}`}
        >
          <div className={styles.field}>
            <strong>Name:</strong> {member.name}
          </div>
          <div className={styles.field}>
            <strong>Email:</strong> {member.email}
          </div>
          <div className={styles.field}>
            <strong>Phone:</strong> {member.phone}
          </div>
          <div className={styles.field}>
            <strong>Address:</strong> {member.address}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Contact;
