"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <header className="w-full py-12 px-16 shadow-lg" style={{ backgroundColor: "rgb(238, 53, 36)" }}>
        <h1 className="text-4xl font-bold text-white">Welcome to the WRU Discovery Tool</h1>
      </header>
      <main className="flex flex-1 w-full flex-col items-center justify-center py-32 px-16 bg-white">
        <div className="flex flex-col items-center justify-center max-w-3xl w-full">
          {/* View Toggle Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setViewMode("map")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "map"
                  ? "bg-red-600 text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-red-600 text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              List
            </button>
          </div>

          {/* Map View */}
          {viewMode === "map" && (
            <div className="w-full flex flex-col items-center">
              <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d19877.117945940747!2d-3.1570815999999997!3d51.48312669999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1770461600485!5m2!1sen!2suk" width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="w-full">
              <div className="space-y-3">
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="font-semibold text-gray-800">Rugby Club 1</p>
                  <p className="text-sm text-gray-600">Location details here</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="font-semibold text-gray-800">Rugby Club 2</p>
                  <p className="text-sm text-gray-600">Location details here</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="font-semibold text-gray-800">Rugby Club 3</p>
                  <p className="text-sm text-gray-600">Location details here</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <button 
        className="fixed bottom-4 right-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => window.location.href = '/club_page'}
        >
        Club page
      </button>
    </div>
  );
}
