import '../styles/Footer.css';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer w-full py-12 px-16 shadow-lg">
            <div className="left-section">
                
                    <div className="flex items-center gap-4 cursor-pointer">
                        <Link href="/">
                            <img src='/wru_assets/WRU_Primary_Logo.png' alt="Welsh Rugby Union Logo" className="footer-logo" />
                        </Link>
                        <h1 className="text-4xl font-bold text-white footer-title">RUGBY DISCOVERY TOOL</h1>
                    </div>
            </div>
        </footer>
    );
}
