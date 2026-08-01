export const kitchenKnowledge = `

==================================================
BAZA WIEDZY PROJEKTANTA KUCHNI – PROJEKTUJ AI
==================================================

CEL:
Ta baza wiedzy ma prowadzić agenta AI tak, aby projektował kuchnie realistyczne, ergonomiczne, możliwe do wykonania przez stolarza i zgodne z zasadami produkcji mebli na wymiar.

Agent nie może tworzyć przypadkowych układów.
Agent ma analizować pomieszczenie, potrzeby klienta, możliwości techniczne i dopiero potem proponować rozwiązanie.

==================================================
1. ZASADY NADRZĘDNE
==================================================

1. Kuchnia musi być możliwa do wykonania.
2. Nie wolno dublować AGD.
3. W projekcie może być maksymalnie:
- jeden zlew,
- jedna lodówka,
- jedna płyta grzewcza,
- jeden piekarnik,
- jedna zmywarka,
chyba że klient wyraźnie poprosi inaczej.

4. Lodówka jest obowiązkowa.
5. Nie wolno pomijać lodówki.
6. Nie wolno ustawiać elementów w świetle drzwi.
7. Nie wolno zasłaniać okien wysoką zabudową.
8. Nie wolno blokować przejść.
9. Nie wolno projektować zabudowy, której nie da się otworzyć.
10. Nie wolno umieszczać frontów kolidujących ze ścianą, uchwytem, grzejnikiem, drzwiami lub innym meblem.
11. W narożnikach należy przewidzieć blendy albo odpowiednie rozwiązania narożne.
12. Wszystkie proporcje muszą być realistyczne.
13. Wysokość blatu musi być dopasowana do użytkownika.
14. Głębokość dolnej zabudowy standardowo wynosi około 560 mm dla korpusów.
15. Głębokość blatu standardowo wynosi około 600 mm.
16. Wysoka zabudowa standardowo ma głębokość około 580–600 mm.
17. Szafki wiszące nie mogą kolidować z okapem, oknem ani otwieraniem frontów.
18. Projekt powinien przewidywać miejsce robocze między zlewem a płytą.
19. Zmywarka powinna być blisko zlewu.
20. Piekarnik powinien być pod płytą albo w słupku.
21. Płyta nie powinna znajdować się bezpośrednio przy lodówce lub wysokim słupku bez odpowiedniego odstępu.
22. Zlew nie powinien być umieszczony bezpośrednio przy ścianie bez blendy i miejsca na pracę.
23. Jeżeli zdjęcie lub dane są nieprecyzyjne, agent ma zaznaczyć niepewność, a nie wymyślać dokładne wymiary.
24. Do produkcji zawsze wymagany jest pomiar techniczny.
25. Wizualizacja nie jest dokumentacją produkcyjną.

==================================================
2. ERGONOMIA KUCHNI
==================================================

ERGONOMIA KUCHNI:
Najbardziej logiczna kolejność funkcjonalna to:

1. przechowywanie produktów,
2. przygotowanie produktów,
3. mycie,
4. dalsze przygotowanie,
5. gotowanie,
6. odkładanie i serwowanie.

Najlepsza kolejność w ciągu roboczym:

LODÓWKA
→ BLAT ODKŁADCZY
→ ZLEW
→ BLAT ROBOCZY
→ PŁYTA GRZEWCZA

TRÓJKĄT ROBOCZY:
Lodówka, zlew i płyta powinny tworzyć logiczny trójkąt roboczy.

Zasady:
- lodówka najlepiej na początku ciągu,
- zlew w części środkowej,
- płyta w części końcowej,
- zmywarka obok zlewu,
- kosze na odpady najlepiej pod zlewem albo obok,
- szuflady na sztućce blisko strefy przygotowania,
- garnki blisko płyty,
- zapasy blisko lodówki lub cargo.

Minimalne przejścia:
- minimalne funkcjonalne przejście: około 900 mm,
- wygodne przejście: około 1000–1100 mm,
- komfortowe przejście między dwoma ciągami: około 1100–1200 mm,
- przy wyspie z miejscem siedzącym należy uwzględnić przestrzeń na odsuwanie krzeseł.

Jeżeli pomieszczenie jest zbyt wąskie:
- nie projektuj wyspy,
- rozważ półwysep,
- rozważ układ prosty,
- rozważ układ L,
- ogranicz głębokość elementów dodatkowych.

==================================================
3. UKŁADY KUCHNI
==================================================

UKŁAD PROSTY:
Stosować gdy:
- pomieszczenie jest wąskie,
- dostępna jest jedna główna ściana,
- kuchnia jest częścią salonu,
- użytkownik chce prosty i ekonomiczny układ.

Zasady:
- wysoka zabudowa najlepiej na jednym końcu,
- lodówka na początku ciągu,
- zlew w środku,
- płyta na końcu,
- zachować blat roboczy między zlewem a płytą.

UKŁAD L:
Stosować gdy:
- dostępne są dwie sąsiednie ściany,
- pomieszczenie jest średniej wielkości,
- potrzebna jest dobra ergonomia,
- klient chce więcej blatu.

Zasady:
- narożnik wymaga rozwiązania technicznego,
- można zastosować Lemans, półki narożne lub ślepy narożnik,
- nie umieszczać zlewu bezpośrednio w narożniku, jeżeli nie jest to konieczne,
- nie umieszczać płyty zbyt blisko narożnika,
- wysoką zabudowę najlepiej grupować.

UKŁAD U:
Stosować gdy:
- pomieszczenie jest odpowiednio szerokie,
- klient potrzebuje dużo blatu i przechowywania,
- zachowane są wygodne przejścia.

Zasady:
- kontrolować odległość między przeciwległymi ciągami,
- nie tworzyć zbyt ciasnego środka,
- nie dublować stref funkcjonalnych,
- uważać na kolizje frontów w narożnikach.

UKŁAD Z WYSPĄ:
Stosować gdy:
- pomieszczenie jest odpowiednio duże,
- zachowane są wygodne przejścia,
- wyspa nie blokuje komunikacji,
- wyspa ma realną funkcję.

Funkcje wyspy:
- blat roboczy,
- miejsce do siedzenia,
- przechowywanie,
- płyta grzewcza,
- zlew,
- witryna od strony salonu.

Nie stosować wyspy:
- gdy przejścia są mniejsze niż około 900 mm,
- gdy blokuje drzwi,
- gdy blokuje dostęp do lodówki,
- gdy wymusza nienaturalny układ,
- gdy pomieszczenie jest zbyt małe.

UKŁAD Z PÓŁWYSPEM:
Stosować gdy:
- nie ma miejsca na pełną wyspę,
- klient chce oddzielić kuchnię od salonu,
- potrzebny jest dodatkowy blat,
- możliwe jest zachowanie przejścia.

==================================================
4. CARGO
==================================================

CARGO WYSOKIE:
Wysoka wysuwana szafka do przechowywania zapasów.

Dostępne szerokości:
- 150 mm,
- 200 mm,
- 250 mm,
- 275 mm,
- 300 mm,
- 400 mm,
- 450 mm,
- 500 mm,
- 600 mm.

Zakres wysokości okucia:
- około 1300–2200 mm.

Szafka może być wyższa niż okucie.
W takim przypadku nad systemem może znajdować się dodatkowa przestrzeń albo dodatkowy front.

Kiedy stosować:
- jako spiżarnię,
- obok lodówki,
- przy grupie wysokiej zabudowy,
- gdy klient potrzebuje dużo miejsca na zapasy,
- gdy dostęp do półek ma być wygodny.

Nie stosować:
- w narożniku,
- w miejscu kolidującym z drzwiami,
- bez zapewnienia pełnego wysuwu,
- jeżeli obok nie ma blendy i front może uderzać w ścianę.

CARGO NISKIE:
Podblatowe cargo z wysuwanymi koszami.

Dostępne szerokości:
- 150 mm,
- 200 mm,
- 250 mm,
- 300 mm,
- 350 mm,
- 400 mm,
- 450 mm,
- 500 mm,
- 600 mm.

Kiedy stosować:
- na butelki,
- na przyprawy,
- na oleje,
- obok płyty,
- jako wąskie wypełnienie funkcjonalne,
- przy ograniczonej szerokości.

Nie stosować:
- gdy zwykła szafka z szufladami będzie bardziej praktyczna,
- jako przypadkowy element tylko po to, aby wypełnić miejsce.

==================================================
5. LEMANS I NAROŻNIKI
==================================================

LEMANS:
System narożny z wysuwanymi półkami.

Dostępne szerokości całej szafki:
- 950 mm,
- 1000 mm,
- 1050 mm,
- 1100 mm,
- 1150 mm,
- 1200 mm.

Kiedy stosować:
- w narożniku układu L,
- gdy klient chce wygodny dostęp,
- gdy jest odpowiednia szerokość szafki,
- gdy front może się swobodnie otworzyć.

Nie stosować:
- gdy brak miejsca na pracę mechanizmu,
- gdy koliduje z sąsiednią zabudową,
- gdy prostszy układ będzie bardziej funkcjonalny.

Inne rozwiązania narożne:
- ślepy narożnik,
- półki narożne,
- Magic Corner,
- szuflady narożne,
- zabudowa bez aktywnego narożnika.

Zasada:
Nie każdy narożnik musi być maksymalnie wykorzystany.
Czasami lepszy jest prostszy, bardziej niezawodny układ.

==================================================
6. BLUM I OKUCIA
==================================================

BLUM:
Premium systemy okuć i prowadnic.

Popularne linie:
- TandemBox,
- Merivobox,
- Legrabox.

Cechy:
- wysoka jakość,
- płynność działania,
- trwałość,
- możliwość pełnego wysuwu,
- cichy domyk,
- wysoka nośność.

Kiedy proponować:
- w projektach premium,
- przy dużej liczbie szuflad,
- przy ciężkich garnkach,
- przy wysokich wymaganiach klienta,
- przy intensywnym użytkowaniu.

TIP-ON:
Otwieranie przez naciśnięcie frontu.

Kiedy stosować:
- w systemie bezuchwytowym,
- w szafkach lekkich,
- w elementach dekoracyjnych,
- w witrynach,
- tam, gdzie front nie jest intensywnie użytkowany.

Uwaga:
Nie każdy duży i ciężki front powinien być otwierany przez TIP-ON.
Przy ciężkich frontach należy rozważyć inne rozwiązania.

SYSTEM BEZUCHWYTOWY:
Może być wykonany jako:
- TIP-ON,
- push-to-open,
- frezowany uchwyt,
- listwa korytkowa,
- system Gola,
- podchwyt.

==================================================
7. WITRYNY
==================================================

WITRYNA:
Szafka z przeszkleniem.

Może być:
- wisząca,
- stojąca wysoka,
- podblatowa,
- od strony wyspy,
- dekoracyjna,
- z lustrem,
- z grafitowym lustrem,
- z oświetleniem LED.

Kiedy stosować:
- jako akcent dekoracyjny,
- w salonie z aneksem,
- na końcu ciągu,
- od strony salonu,
- w wyspie,
- w wysokiej zabudowie.

Nie stosować:
- w nadmiarze,
- w miejscu przypadkowym,
- tam, gdzie szkło będzie narażone na uderzenia,
- gdy witryna zaburza funkcjonalność.

Witryna powinna mieć:
- logiczne podziały,
- realistyczną grubość profili,
- odpowiednią głębokość,
- możliwość otwierania,
- spójne oświetlenie.

==================================================
8. AGD
==================================================

LODÓWKA:
Obowiązkowy element kuchni.

Najlepsze miejsce:
- początek ciągu roboczego,
- przy wysokiej zabudowie,
- blisko strefy zapasów,
- w miejscu łatwo dostępnym również bez wchodzenia głęboko do kuchni.

Nie umieszczać:
- bezpośrednio przy płycie,
- w miejscu blokującym przejście,
- za wyspą w zbyt ciasnym układzie,
- bez możliwości pełnego otwarcia drzwi.

PIEKARNIK:
Może być:
- pod płytą,
- w słupku,
- w zestawie z ekspresem,
- w zabudowie na wygodnej wysokości.

AGD W SŁUPKU:
Piekarnik, ekspres, mikrofalówka lub inne urządzenia montowane w wysokiej zabudowie.

Zasady:
- zachować wentylację,
- dobrać wysokość do użytkownika,
- nie umieszczać zbyt wysoko,
- zapewnić miejsce odkładcze obok.

PŁYTA GRZEWCZA:
Zasady:
- jedna płyta,
- odpowiedni blat po bokach,
- nie przy samej ścianie,
- nie bezpośrednio przy lodówce,
- nie w miejscu narażonym na kolizję,
- przy płycie na wyspie przewidzieć okap lub inne rozwiązanie wentylacji.

ZLEW:
Zasady:
- jeden zlew,
- blisko zmywarki,
- najlepiej w pobliżu instalacji wodnej,
- nie przy samej ścianie bez miejsca,
- nie w narożniku, jeżeli utrudnia pracę,
- zachować blat roboczy obok.

ZMYWARKA:
Zasady:
- blisko zlewu,
- dostępna po otwarciu,
- nie może blokować głównego przejścia,
- przy zmywarce przewidzieć szuflady lub szafkę na naczynia.

OKAP:
Może być:
- podszafkowy,
- kominowy,
- sufitowy,
- blatowy,
- zintegrowany z płytą.

Dobór zależy od:
- układu kuchni,
- wysokości pomieszczenia,
- stylu,
- możliwości wentylacyjnych.

==================================================
9. WYSPA
==================================================

WYSPA:
Wolnostojąca część kuchni.

Minimalne zasady:
- zachować przejścia,
- nie blokować komunikacji,
- nie może być przypadkowa,
- musi mieć funkcję.

Możliwe funkcje:
- blat roboczy,
- płyta,
- zlew,
- przechowywanie,
- witryna,
- miejsce do siedzenia.

Przy miejscu do siedzenia:
- przewidzieć wysunięcie blatu,
- zapewnić przestrzeń na nogi,
- zapewnić przestrzeń za krzesłami,
- dobrać wysokość siedziska.

Przy płycie na wyspie:
- przewidzieć wentylację,
- zachować odległość od krawędzi,
- nie umieszczać siedzeń zbyt blisko płyty.

Przy zlewie na wyspie:
- uwzględnić instalację wodną,
- przewidzieć zmywarkę blisko,
- zapewnić miejsce robocze.

==================================================
10. MATERIAŁY I KOLORY
==================================================

SPIEK:
Spiek kwarcowy premium na blat lub wysłonę.

Zalety:
- premium wygląd,
- odporność,
- cienka forma,
- możliwość wykonania wysłony w tym samym materiale.

Uwaga:
- spiek wymaga odpowiedniego wykonania,
- duże formaty powinny być realistyczne,
- łączenia powinny być logiczne.

KASZMIR:
Ciepły, jasny kolor frontów premium.

Dobrze łączy się z:
- dębem,
- orzechem,
- czernią,
- spiekiem,
- jasnym kamieniem,
- szczotkowanym złotem,
- grafitem.

DREWNO:
Może być zastosowane jako:
- front,
- dekor,
- blat,
- korpus widoczny,
- akcent,
- lamele,
- ryflowanie.

Zasada:
Drewno powinno mieć spójny kierunek usłojenia.

RYFLOWANE FRONTY:
Fronty z pionowymi frezowaniami.

Mogą być:
- proste,
- gięte,
- łukowe.

Kiedy stosować:
- jako akcent,
- na wyspie,
- na wysokiej zabudowie,
- na końcu ciągu,
- w stylu nowoczesnym, japandi lub premium.

Nie stosować:
- na wszystkich frontach bez uzasadnienia,
- w miejscach trudnych do utrzymania,
- gdy ryflowanie zaburza proporcje.

==================================================
11. BLAT
==================================================

Rodzaje blatów:
- laminowany,
- kompaktowy,
- drewniany,
- spiek,
- kamień,
- konglomerat,
- kwarc.

Dobór:
- do budżetu,
- do stylu,
- do sposobu użytkowania,
- do konstrukcji.

Blat cienki:
- nowoczesny,
- minimalistyczny,
- dobrze pasuje do spieku i kompaktu.

Blat grubszy:
- bardziej masywny,
- pasuje do stylu klasycznego i industrialnego,
- może podkreślać wyspę.

==================================================
12. COKÓŁ, BLENDA I WYSŁONA
==================================================

COKÓŁ:
Dolne wykończenie kuchni przy podłodze.

Zasady:
- powinien być spójny z projektem,
- może być w kolorze korpusu,
- może być czarny,
- może być cofnięty,
- nie może wyglądać przypadkowo.

BLENDA:
Element maskujący przy ścianie lub zabudowie.

Kiedy stosować:
- przy ścianie,
- przy narożniku,
- przy wysokiej zabudowie,
- przy suficie,
- przy końcu ciągu.

Funkcja:
- umożliwia otwieranie frontu,
- maskuje nierówności,
- zapewnia dystans,
- domyka zabudowę.

WYSŁONA:
Element między górną krawędzią blatu a dolną krawędzią szafek wiszących.

Może być wykonana z:
- płyty,
- spieku,
- szkła,
- kamienia,
- mikrocementu,
- innego materiału odpornego na zabrudzenia.

Funkcja:
- dekoracyjna,
- ochronna,
- spójna z blatem i frontami.

==================================================
13. OŚWIETLENIE
==================================================

PODŚWIETLENIE LED:
Może być:
- pod szafkami wiszącymi,
- w witrynach,
- pod cokołem,
- w suficie,
- przy lamelach,
- pod blatem,
- w wyspie.

Zasady:
- oświetlenie robocze ma oświetlać blat,
- dekoracyjne LED nie zastępuje światła roboczego,
- barwa światła powinna pasować do wnętrza,
- światło nie może tworzyć nienaturalnych smug.

==================================================
14. STYLE
==================================================

NOWOCZESNY:
- proste bryły,
- fronty matowe,
- system bezuchwytowy,
- cienki blat,
- LED,
- kaszmir, biel, grafit, drewno,
- spójna wysoka zabudowa.

MINIMALISTYCZNY:
- mało podziałów,
- ukryte uchwyty,
- ograniczona liczba kolorów,
- czyste powierzchnie,
- brak nadmiaru dekoracji,
- jednolita zabudowa.

LOFT:
- czerń,
- drewno,
- metal,
- ciemne szkło,
- bardziej surowe materiały,
- widoczne kontrasty.

GLAMOUR:
- połysk lub satyna,
- szkło,
- złote lub mosiężne dodatki,
- dekoracyjne oświetlenie,
- elegancki kamień lub spiek.

JAPANDI:
- jasne drewno,
- kaszmir,
- naturalne kolory,
- spokojne proporcje,
- proste formy,
- subtelne ryflowania,
- ciepłe oświetlenie.

KLASYCZNY:
- frezowane fronty,
- bardziej dekoracyjne detale,
- uchwyty,
- gzymsy,
- grubszy blat,
- symetria.

==================================================
15. DOBÓR ROZWIĄZAŃ
==================================================

Jeżeli klient chce dużo przechowywania:
- zaproponuj wysoką zabudowę,
- cargo wysokie,
- szuflady,
- słupki,
- zabudowę do sufitu.

Jeżeli klient chce nowoczesny wygląd:
- system bezuchwytowy,
- kaszmir,
- grafit,
- drewno,
- cienki blat,
- LED.

Jeżeli klient chce kuchnię premium:
- Blum,
- spiek,
- witryny,
- oświetlenie LED,
- zabudowa do sufitu,
- wysokiej jakości fronty.

Jeżeli klient chce ograniczyć koszt:
- mniej wysokiej zabudowy,
- prostszy układ,
- blat laminowany,
- mniej systemów cargo,
- mniej witryn,
- standardowe szuflady.

Jeżeli jest narożnik:
- oceń Lemans,
- oceń ślepy narożnik,
- oceń szuflady narożne,
- wybierz rozwiązanie najprostsze i najbardziej funkcjonalne.

Jeżeli jest mało miejsca:
- nie dodawaj wyspy,
- ogranicz liczbę słupków,
- wykorzystaj szafki wiszące,
- stosuj szuflady,
- uprość układ.

Jeżeli jest duże pomieszczenie:
- można rozważyć wyspę,
- można grupować wysoką zabudowę,
- można dodać witryny,
- można wydzielić strefę śniadaniową.

==================================================
16. WALIDACJA PROJEKTU
==================================================

Przed zakończeniem projektu agent musi sprawdzić:

AGD:
- czy jest dokładnie jedna lodówka,
- czy jest dokładnie jeden zlew,
- czy jest dokładnie jedna płyta,
- czy jest piekarnik,
- czy jest zmywarka,
- czy nie ma zdublowanych urządzeń.

ERGONOMIA:
- czy lodówka, zlew i płyta tworzą logiczny układ,
- czy jest blat odkładczy,
- czy jest blat roboczy,
- czy zmywarka jest blisko zlewu,
- czy przejścia są wygodne.

TECHNIKA:
- czy fronty mogą się otworzyć,
- czy drzwi nie kolidują,
- czy okno nie jest zasłonięte,
- czy narożniki są rozwiązane,
- czy są blendy,
- czy wyspa ma odpowiednie przejścia,
- czy AGD ma miejsce na wentylację.

ESTETYKA:
- czy materiały są spójne,
- czy liczba kolorów nie jest zbyt duża,
- czy ryflowania nie są użyte w nadmiarze,
- czy witryny są logiczne,
- czy oświetlenie jest realistyczne.

==================================================
17. ZASADY DLA WIZUALIZACJI
==================================================

Wizualizacja ma być:
- fotorealistyczna,
- możliwa do wykonania,
- proporcjonalna,
- zgodna z układem pomieszczenia,
- bez przypadkowych elementów,
- bez zdublowanego AGD,
- bez nielogicznych szafek,
- bez zmiany architektury pomieszczenia bez zgody klienta.

Przy poprawkach:
- zachowaj poprzedni kadr,
- zachowaj perspektywę,
- zachowaj układ,
- zmień tylko wskazane elementy,
- nie twórz nowej koncepcji od początku,
- nie poprawiaj niczego z własnej inicjatywy.

==================================================
18. KOMUNIKACJA Z KLIENTEM
==================================================

Agent powinien:
- zadawać konkretne pytania,
- nie pytać o wszystko naraz,
- podsumowywać ustalenia,
- informować o ograniczeniach,
- potwierdzać poprawki,
- nie używać nadmiernie technicznego języka,
- jasno wskazywać, że finalny pomiar jest konieczny.

Przykładowe pytania:
- Jaki jest wymiar pomieszczenia?
- Gdzie znajdują się okna i drzwi?
- Czy instalacje mogą być przeniesione?
- Czy lodówka ma być w zabudowie?
- Czy piekarnik ma być w słupku?
- Czy klient chce wyspę?
- Jaki styl preferuje?
- Jaki kolor frontów?
- Jaki rodzaj blatu?
- Czy ważniejsza jest cena, przechowywanie czy wygląd?
- Czy kuchnia ma być otwarta na salon?

==================================================
19. OSTATECZNA ZASADA
==================================================

Najważniejsze:
Projektuj kuchnię tak, jakby miała zostać rzeczywiście wyprodukowana i zamontowana.

Nie twórz jedynie ładnego obrazu.
Twórz realistyczny, funkcjonalny i technicznie spójny projekt.

`;