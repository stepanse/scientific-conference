import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPanel.module.css';
import Loader from '../ui/Loader/Loader';
import { Link } from 'react-router-dom';
import Title from '../ui/Title/Title';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fetchWithAuth } from '../../utils/api';
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

async function handleDownloadProgram() {
    const token = localStorage.getItem("access_token");
    const res = await fetch("http://scientific-conference-backend.tutik/api/admin/program/download/", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "program.pdf";
    a.click();
    URL.revokeObjectURL(url);
}

async function handleDownloadBadges() {
    const token = localStorage.getItem("access_token");
    try {
        const res = await fetch("http://scientific-conference-backend.tutik/api/admin/badges/download/", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) { alert("Failed to generate badges"); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "badges.pdf";
        a.click();
        URL.revokeObjectURL(url);
    } catch {
        alert("Connection error");
    }
}

export default function AdminPanel() {
    library.add(fas, far, fab)
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchAdminData() {
            const token = localStorage.getItem("access_token");
            if (!token) { navigate("/"); return; }
            try {
                const res = await fetchWithAuth("http://scientific-conference-backend.tutik/api/admin-panel/", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) {
                    setError("Access denied");
                    setLoading(false);
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    setTimeout(() => navigate("/"), 2000);
                    return;
                }
                const responseData = await res.json();
                setData(responseData);
                setLoading(false);
            } catch {
                setError("Connection error");
                setLoading(false);
            }
        }
        fetchAdminData();
    }, [navigate]);

    function handleLogout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
    }

    if (error) return (
        <div className={styles.container}>
            <Title>{error}</Title>
            <p className={styles.redirecting}>Your session has expired. Redirecting to home...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <Title text="Admin Panel" />

            {loading ? (
                <Loader />
            ) : (
                <div className={styles.fadeIn}>
                    <div className={styles.buttonGrid}>
                        <Link to="/admin-panel/participants-info" className={styles.adminButton}>
                            <span className={styles.iconWrapper}>
                                <FontAwesomeIcon icon="fa-solid fa-user-group" className={styles.adminIcon} />
                            </span>
                            <h3 className={styles.buttonTitle}>Participants Info</h3>
                            <p className={styles.description}>View all participants</p>
                        </Link>

                        <Link to="/admin-panel/edit-participants" className={styles.adminButton}>
                            <span className={styles.iconWrapper}>
                                <FontAwesomeIcon icon="fa-solid fa-user-gear" className={styles.adminIcon} />
                            </span>
                            <h3 className={styles.buttonTitle}>Edit Participants and Abstracts</h3>
                            <p className={styles.description}>Add, edit or remove participants and their abstracts</p>
                        </Link>

                        <button onClick={handleDownloadBadges} className={styles.adminButton}>
                            <span className={styles.iconWrapper}>
                                <FontAwesomeIcon icon="fa-solid fa-newspaper" className={styles.adminIcon} />
                            </span>
                            <h3 className={styles.buttonTitle}>Download Badges</h3>
                            <p className={styles.description}>Generate and download participant badges</p>
                        </button>

                        <Link to="/admin-panel/edit-program" className={styles.adminButton}>
                            <span className={styles.iconWrapper}>
                                <FontAwesomeIcon icon="fa-solid fa-calendar" className={styles.adminIcon} />
                            </span>
                            <h3 className={styles.buttonTitle}>Edit Program</h3>
                            <p className={styles.description}>Manage conference schedule</p>
                        </Link>

                        <Link to="/admin-panel/edit-web-info" className={styles.adminButton}>
                            <span className={styles.iconWrapper}>
                                <FontAwesomeIcon icon="fa-solid fa-globe" className={styles.adminIcon} />
                            </span>
                            <h3 className={styles.buttonTitle}>Edit Web Info</h3>
                            <p className={styles.description}>Update website content</p>
                        </Link>

                        <button onClick={handleDownloadProgram} className={styles.adminButton}>
                            <span className={styles.iconWrapper}>
                                <FontAwesomeIcon icon="fa-solid fa-download" className={styles.adminIcon} />
                            </span>
                            <h3 className={styles.buttonTitle}>Download Program PDF</h3>
                            <p className={styles.description}>Export conference program</p>
                        </button>
                    </div>
                    <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
                </div>
            )}
        </div>
    );
}