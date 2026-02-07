import '../styles/Header.css';

export default function Header() {
    return (
        <header className="header w-full py-12 px-16 shadow-lg" >
            <div className="left-section">
                <div className="flex items-center gap-4">
                    <img src='/wru_assets/WRU_Primary_Logo.png' alt="Welsh Rugby Union Logo" className="header-logo" />
                    <h1 className="text-4xl font-bold text-white header-title">DISCOVER WELSH RUGBY</h1>
                </div>
            </div>
        </header>
    );
}
