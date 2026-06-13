import styles from './HomeCard.module.css';
import avatar from '../../../assets/avatar.png';

export default function HomeCard({ name, department, email, photo }) {
const imgSrc = photo
  ? (photo.startsWith("http") ? photo : `http://scientific-conference-backend.tutik${photo}`)
  : avatar;
  return (
    <div className={styles.card}>
      <img src={imgSrc} alt={name} className={styles.image} />
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.department}>{department}</p>
      <p className={styles.email}>{email}</p>
    </div>
  );
}