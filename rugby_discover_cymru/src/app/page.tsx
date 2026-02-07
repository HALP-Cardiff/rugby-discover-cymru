import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <header className="w-full py-12 px-16 shadow-lg" style={{ backgroundColor: "rgb(238, 53, 36)" }}>
        <h1 className="text-4xl font-bold text-white">Welcome to the WRU Discovery Tool</h1>
      </header>
      <main className="flex flex-1 w-full flex-col items-center justify-center py-32 px-16 bg-white">
        <div className="flex flex-col items-center justify-center max-w-3xl">
          <p className="text-lg text-gray-700">Map view</p>
          <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d19877.117945940747!2d-3.1570815999999997!3d51.48312669999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1770461600485!5m2!1sen!2suk" width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </main>
    </div>
  );
}
