import { useRef } from "react";
import BookingForm from "@/components/BookingForm";
import { Link } from "react-router-dom";

export default function Booking() {
  const artists = ["hintell", "dark-koko", "swazz", "meesch"];

  const faqs = [
    {
      q: "Minimum notice period?",
      a: "We recommend at least 4-6 weeks notice for domestic events and 8-12 weeks for international bookings."
    },
    {
      q: "International tour logistics?",
      a: "Yes — our team manages travel, accommodation, and rider requirements for international performances."
    },
    {
      q: "Submit music for the label?",
      a: "Send your demo to demos@1jamaicamusic.com with your artist name and genre."
    },
    {
      q: "What genres do you represent?",
      a: "Our roster covers Dancehall, Hip-Hop, Afrobeats, Electronic, and Trap."
    },
    {
      q: "License music from catalog?",
      a: "Contact licensing@1jamaicamusic.com with details of your project and we will arrange a sync deal."
    }
  ];

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen">
      
      {/* HERO */}
      <section className="relative pt-48 pb-24 px-6 md:px-12 border-b border-[var(--brand-border)] overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.25]"
          style={{ backgroundImage: `url('/booking-banner.jpg')` }}
        />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-white text-7xl md:text-[8rem] font-bebas leading-none mb-6 text-[var(--brand-yellow)]">
            BOOK AN ARTIST
          </h1>
          <p className="text-[var(--brand-white)] font-sans text-2xl max-w-3xl mx-auto">
            From club nights to international festivals we make it happen.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 md:px-12 bg-[var(--brand-dark)] border-b border-[var(--brand-border)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-white text-4xl font-bebas mb-16 tracking-widest">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full border-2 border-[var(--brand-yellow)] flex items-center justify-center text-[var(--brand-yellow)] font-bebas text-3xl mb-6 group-hover:bg-[var(--brand-yellow)] group-hover:text-black transition-colors">
                1
              </div>
              <h3 className="text-white font-bebas text-2xl mb-4">Submit your inquiry</h3>
              <p className="text-[var(--brand-gray)] font-sans">Fill out the booking form with your event details.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full border-2 border-[var(--brand-yellow)] flex items-center justify-center text-[var(--brand-yellow)] font-bebas text-3xl mb-6 group-hover:bg-[var(--brand-yellow)] group-hover:text-black transition-colors">
                2
              </div>
              <h3 className="text-white font-bebas text-2xl mb-4">We get in touch</h3>
              <p className="text-[var(--brand-gray)] font-sans">Our team responds within 48 hours to discuss terms.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full border-2 border-[var(--brand-yellow)] flex items-center justify-center text-[var(--brand-yellow)] font-bebas text-3xl mb-6 group-hover:bg-[var(--brand-yellow)] group-hover:text-black transition-colors">
                3
              </div>
              <h3 className="text-white font-bebas text-2xl mb-4">Confirm and perform</h3>
              <p className="text-[var(--brand-gray)] font-sans">Finalise the booking and let the music do the rest.</p>
            </div>

          </div>
        </div>
      </section>

      {/* MAIN FORM & ARTISTS */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-7">
          <div className="mb-12">
            <span className="inline-block text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest mb-4">BOOKING REQUEST</span>
            <p className="text-[var(--brand-gray)] font-sans">All fields are required. Please provide as much detail as possible about your event.</p>
          </div>
          <div className="bg-[var(--brand-card)] p-8 md:p-10 border border-[var(--brand-border)] rounded-xl shadow-2xl">
            <BookingForm />
          </div>
        </div>

        <div className="lg:col-span-5">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest mb-8">WHO YOU CAN BOOK</span>
          <div className="flex flex-col gap-4">
            {artists.map((artist) => (
              <Link 
                key={artist}
                to={`/artists/${artist}`}
                className="flex items-center gap-4 p-4 border border-[var(--brand-border)] bg-[var(--brand-card)] hover:border-[var(--brand-yellow)] transition-colors group"
              >
                <img 
                  src={`/${artist === 'dark-koko' ? 'dark-koko' : artist}.jpg`}
                  alt={artist}
                  className="w-16 h-16 object-cover brightness-75 group-hover:brightness-100 rounded-sm"
                />
                <div>
                  <h4 className="text-white font-bebas text-2xl group-hover:text-[var(--brand-yellow)] transition-colors">
                    {artist.replace('-', ' ').toUpperCase()}
                  </h4>
                  <span className="text-[var(--brand-gray)] font-sans text-sm">View Profile →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </section>

      {/* FAQ */}
      <section className="py-24 px-6 md:px-12 bg-[var(--brand-dark)] border-t border-[var(--brand-border)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-white text-4xl font-bebas mb-12 tracking-widest">FREQUENTLY ASKED QUESTIONS</h2>
          
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-6">
                <h4 className="text-[var(--brand-yellow)] font-sans font-bold text-lg mb-2">Q: {faq.q}</h4>
                <p className="text-white font-sans">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
