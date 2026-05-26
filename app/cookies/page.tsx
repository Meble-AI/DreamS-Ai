export default function CookiesPage() {

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      p-10
    ">

      <div className="
        max-w-5xl
        mx-auto
      ">

        <h1 className="
          text-5xl
          font-bold
          mb-10
        ">
          Pliki cookies
        </h1>

        <div className="
          space-y-8
          text-white/70
          leading-8
          text-lg
        ">

          <p>
            DreamS AI wykorzystuje
            pliki cookies w celu:
          </p>

          <ul className="
            list-disc
            pl-10
            space-y-3
          ">
            <li>utrzymania sesji logowania,</li>
            <li>zapamiętywania ustawień,</li>
            <li>analizy ruchu na stronie,</li>
            <li>poprawy działania platformy.</li>
          </ul>

          <p>
            Korzystając z serwisu,
            użytkownik wyraża zgodę
            na wykorzystywanie
            plików cookies.
          </p>

        </div>

      </div>

    </main>
  );
}