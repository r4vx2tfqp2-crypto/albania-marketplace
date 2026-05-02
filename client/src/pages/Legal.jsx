import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = {
  terms: {
    title: 'Kushtet dhe Rregullat',
    lastUpdated: 'Prill 2026',
    content: [
      {
        heading: '1. Pranimi i Kushteve',
        text: 'Duke hyrë dhe përdorur Tregu.store ("Platforma"), ju pranoni të jeni të detyruar nga këto Kushte dhe Rregulla. Nëse nuk jeni dakord me këto kushte, ju lutemi mos e përdorni platformën tonë. Tregu është një treg online që lidh blerësit dhe shitësit në Shqipëri.'
      },
      {
        heading: '2. Përshkrimi i Platformës',
        text: 'Tregu.store është një platformë tregu që lejon bizneset dhe individët e regjistruar ("Shitës") të listojnë dhe shesin produkte tek klientët ("Blerës") në Shqipëri. Tregu vepron vetëm si ndërmjetës dhe nuk është përgjegjës për cilësinë, sigurinë ose ligjshmërinë e artikujve të listuar.'
      },
      {
        heading: '3. Garancitë Tona për Shitësit',
        text: 'Listimi i produkteve është plotësisht FALAS gjatë fazës së lansimit — të paktën 6 muajt e parë. Nuk ka kontratë — mund të largoheni kur të doni pa asnjë penalitet. Nëse vendosim të ndryshojmë çmimet, do t\'ju njoftojmë 30 ditë përpara me email. Nuk kemi akses në llogarinë tuaj bankare dhe nuk mund të marrim asnjë para pa miratimin tuaj.'
      },
      {
        heading: '4. Llogaritë e Përdoruesve',
        text: 'Për të shitur në Tregu, duhet të krijoni një llogari dhe të jepni informacion të saktë. Jeni përgjegjës për ruajtjen e konfidencialitetit të kredencialeve të llogarisë suaj. Tregu rezervon të drejtën të pezullojë ose përfundojë llogaritë që shkelin këto kushte.'
      },
      {
        heading: '5. Përgjegjësitë e Shitësit',
        text: 'Shitësit duhet të ofrojnë përshkrime të sakta të produkteve, çmimeve dhe disponueshmërisë. Shitësit janë përgjegjës për përmbushjen e porosive në kohë dhe ruajtjen e komunikimit profesional me blerësit. Të gjitha produktet e listuara duhet të jenë në përputhje me ligjin shqiptar.'
      },
      {
        heading: '6. Produktet e Ndaluara',
        text: 'Produktet e mëposhtme janë rreptësisht të ndaluara në Tregu: mallra të paligjshme, produkte false, armë, materiale të rrezikshme, dhe çdo gjë që shkel ligjin shqiptar. Shkeljet do të rezultojnë në përfundimin e menjëhershëm të llogarisë.'
      },
      {
        heading: '7. Tarifat dhe Pagesat',
        text: 'Tregu mund të ngarkojë shitësit me një tarifë abonimi ose komision për përdorimin e platformës në të ardhmen. Çmimet aktuale janë të disponueshme në platformë. Tregu rezervon të drejtën të modifikojë strukturën e tarifave me njoftim 30 ditë për shitësit.'
      },
      {
        heading: '8. Zgjidhja e Mosmarrëveshjeve',
        text: 'Në rast mosmarrëveshjesh midis blerësve dhe shitësve, Tregu mund të ndihmojë në ndërmjetësim por nuk është ligjërisht përgjegjës për rezultatin. Përdoruesit inkurajohen të zgjidhin mosmarrëveshjet me mirëkuptim.'
      },
      {
        heading: '9. Kufizimi i Përgjegjësisë',
        text: 'Tregu nuk është përgjegjës për asnjë dëm të drejtpërdrejtë, indirekt ose pasojë që lind nga përdorimi i platformës. Ne nuk garantojmë shërbim të pandërprerë dhe nuk jemi përgjegjës për humbjet e shkaktuara nga probleme teknike.'
      },
      {
        heading: '10. Ligji i Zbatueshëm',
        text: 'Këto kushte rregullohen nga ligjet e Republikës së Shqipërisë. Çdo mosmarrëveshje ligjore do të zgjidhet në gjykatat e Tiranës, Shqipëri.'
      },
      {
        heading: '11. Ndryshimet e Kushteve',
        text: 'Tregu rezervon të drejtën të modifikojë këto kushte në çdo kohë. Përdoruesit do të njoftohen për ndryshimet e rëndësishme me email ose njoftim në platformë. Vazhdimi i përdorimit të platformës pas ndryshimeve përbën pranimin e kushteve të reja.'
      },
      {
        heading: '12. Kontakti',
        text: 'Për pyetje rreth këtyre kushteve, na kontaktoni: info@tregu.store'
      },
    ]
  },
  privacy: {
    title: 'Politika e Privatësisë',
    lastUpdated: 'Prill 2026',
    content: [
      {
        heading: '1. Informacioni që Mbledhim',
        text: 'Mbledhim informacionin që jepni kur krijoni një llogari (emri, email, numri i telefonit), kur listoni produkte (detajet e dyqanit, informacioni i produktit), dhe kur bëni porosi (adresa e dorëzimit, detajet e kontaktit). Gjithashtu mbledhim të dhëna përdorimi si modelet e shfletimit dhe kërkesat.'
      },
      {
        heading: '2. Si Përdorim Informacionin Tuaj',
        text: 'Informacioni juaj përdoret për të operuar platformën, për të përpunuar porositë, për të komunikuar me ju rreth llogarisë suaj, për të përmirësuar shërbimet tona, për të parandaluar mashtrimet dhe për të respektuar detyrimet ligjore. Ne nuk shesim të dhënat tuaja personale tek palë të treta.'
      },
      {
        heading: '3. Ndarja e të Dhënave',
        text: 'Ne ndajmë informacionin e nevojshëm midis blerësve dhe shitësve për të përfunduar transaksionet (p.sh. adresa e dorëzimit ndahet me shitësin). Mund të ndajmë të dhëna me ofruesit e shërbimeve që ndihmojnë në operimin e platformës sonë. Do të ndajmë të dhëna me autoritet ligjor kur kërkohet me ligj.'
      },
      {
        heading: '4. Ruajtja e të Dhënave',
        text: 'Të dhënat tuaja ruhen në mënyrë të sigurt në serverët në Bashkimin Europian. Ne përdorim enkriptim dhe masa sigurie të standardit të industrisë për të mbrojtur informacionin tuaj. Ruajmë të dhënat tuaja për aq kohë sa llogaria juaj është aktive.'
      },
      {
        heading: '5. Të Drejtat Tuaja',
        text: 'Keni të drejtë të aksesoni të dhënat tuaja personale, të korrigjoni të dhënat e pasakta, të kërkoni fshirjen e të dhënave tuaja dhe të tërhiqni pëlqimin në çdo kohë. Për të ushtruar këto të drejta, na kontaktoni: info@tregu.store'
      },
      {
        heading: '6. Cookies',
        text: 'Ne përdorim cookies thelbësore për të operuar platformën dhe cookies analitike për të kuptuar si ndërveprojnë përdoruesit me shërbimin tonë. Mund të kontrolloni cilësimet e cookies përmes shfletuesit tuaj.'
      },
      {
        heading: '7. Privatësia e Fëmijëve',
        text: 'Tregu nuk është i destinuar për përdoruesit nën 16 vjeç. Ne nuk mbledhim me dijeni informacion personal nga fëmijët. Nëse besoni se një fëmijë na ka dhënë informacion personal, ju lutemi na kontaktoni menjëherë.'
      },
      {
        heading: '8. Ndryshimet e Politikës',
        text: 'Mund ta përditësojmë këtë politikë periodikisht. Do t\'ju njoftojmë për ndryshimet e rëndësishme me email. Vazhdimi i përdorimit të platformës pas ndryshimeve përbën pranimin e politikës së përditësuar.'
      },
      {
        heading: '9. Kontakti',
        text: 'Për pyetje rreth privatësisë, na kontaktoni: info@tregu.store'
      },
    ]
  },
  copyright: {
    title: 'E Drejta e Autorit',
    lastUpdated: 'Prill 2026',
    content: [
      {
        heading: '1. Pronësia e Platformës',
        text: 'Tregu.store dhe të gjitha përmbajtjet, funksionet dhe funksionalitetet e tij janë pronë e Tregu dhe mbrohen nga e drejta e autorit shqiptare dhe ndërkombëtare, marka tregtare dhe ligje të tjera të pronësisë intelektuale.'
      },
      {
        heading: '2. Përmbajtja e Shitësit',
        text: 'Shitësit ruajnë pronësinë e fotove të produkteve, përshkrimeve dhe përmbajtjeve të tjera që ngarkojnë në Tregu. Duke ngarkuar përmbajtje, shitësit i japin Tregu një licencë jo-ekskluzive për të shfaqur, riprodhuar dhe promovuar atë përmbajtje në platformë.'
      },
      {
        heading: '3. Përdorimi i Ndaluar',
        text: 'Nuk mund të kopjoni, riprodhoni, shpërndani ose krijoni vepra derivative nga dizajni, kodi ose përmbajtja e platformës Tregu pa lejen e shkruar eksplicite. Mbledhja e automatizuar e të dhënave nga platforma është rreptësisht e ndaluar.'
      },
      {
        heading: '4. Produktet Falso',
        text: 'Listimi i produkteve false, kopjeve ose produkteve të markave të paautorizuara është rreptësisht i ndaluar. Shkeljet do të rezultojnë në përfundimin e menjëhershëm të llogarisë dhe mund të raportohen tek autoritetet përkatëse.'
      },
      {
        heading: '5. Marka Tregtare',
        text: 'Emri Tregu, logoja dhe marka janë marka tregtare të Tregu.store. Nuk mund t\'i përdorni këto marka tregtare pa lejen e mëparshme me shkrim nga Tregu.'
      },
      {
        heading: '6. Ankesat e së Drejtës së Autorit',
        text: 'Nëse besoni se përmbajtja në Tregu shkel të drejtën tuaj të autorit, ju lutemi na kontaktoni: info@tregu.store me detajet e shkeljes. Do të hetojmë dhe do të marrim veprimet e duhura.'
      },
      {
        heading: '7. Përmbajtja e Gjeneruar nga Përdoruesit',
        text: 'Duke dërguar komente, vlerësime ose përmbajtje të tjera në Tregu, ju na jepni një licencë të përjetshme, pa honorar për të përdorur, modifikuar dhe shfaqur atë përmbajtje. Ju konfirmoni që përmbajtja juaj nuk shkel të drejtat e palëve të treta.'
      },
    ]
  }
};

export default function Legal() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('terms');
  const page = SECTIONS[activePage];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      <div style={{ background: 'var(--text-1)', padding: '40px 20px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 24 }}>
            <ArrowLeft size={15} /> Kthehu
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Informacion Ligjor
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
            {page.title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            Përditësuar: {page.lastUpdated}
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(SECTIONS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActivePage(key)}
                style={{
                  padding: '10px 18px', fontSize: 14, fontWeight: 500,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                  background: 'none', border: 'none',
                  borderBottom: activePage === key ? '2px solid #fff' : '2px solid transparent',
                  color: activePage === key ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {key === 'terms' ? 'Kushtet' : key === 'privacy' ? 'Privatësia' : 'E Drejta e Autorit'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        {page.content.map((section, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>
              {section.heading}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8 }}>
              {section.text}
            </p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, marginTop: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7 }}>
            Këto politika zbatohen për të gjithë përdoruesit e platformës Tregu. Duke përdorur Tregu, ju pranoni se keni lexuar dhe kuptuar këto politika. Për çdo pyetje na kontaktoni: <strong>info@tregu.store</strong>
          </p>
        </div>
      </div>
    </div>
  );
}