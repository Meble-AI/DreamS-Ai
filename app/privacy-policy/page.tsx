export default function PrivacyPolicyPage() {

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
          Polityka prywatności
        </h1>

        <div className="
          space-y-8
          text-white/70
          leading-8
          text-lg
        ">

          <p>
            DreamS AI przetwarza dane użytkowników
            wyłącznie w celu realizacji usług
            projektowania wnętrz i generowania
            wizualizacji AI.
          </p>

          <p>
            Dane takie jak adres e-mail,
            przesłane zdjęcia oraz informacje
            projektowe są przechowywane
            w bezpiecznej infrastrukturze.
          </p>

          <p>
            Użytkownik ma prawo do:
          </p>

          <ul className="
            list-disc
            pl-10
            space-y-3
          ">
            <li>wglądu do danych,</li>
            <li>usunięcia danych,</li>
            <li>edycji danych,</li>
            <li>wycofania zgody.</li>
          </ul>

          <p>
            Korzystając z DreamS AI,
            użytkownik akceptuje
            niniejszą politykę prywatności.
          </p>

        </div>

      </div>

    </main>
  );
}