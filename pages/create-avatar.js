import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(fields, features, accessories, customHairColour = '', customClothing = '', customEthnicity = '') {
  const resolvedEthnicity = fields.ethnicity === 'Other...' ? customEthnicity : fields.ethnicity
  const charParts = [
    `${fields.age}, ${fields.gender}, ${resolvedEthnicity} appearance`,
    `${fields.hairLength} ${(fields.hairColour === 'Custom...' ? customHairColour : fields.hairColour).toLowerCase()} hair${fields.hairTexture ? ` — ${fields.hairTexture.toLowerCase()}` : ''}`,
    fields.eyes ? `${fields.eyes.toLowerCase()} eyes` : null,
features.length ? features.join(', ') : null,
    fields.clothing ? `dressed in ${(fields.clothing === 'Custom...' ? customClothing : fields.clothing).toLowerCase()}` : null,
    accessories.length ? accessories.join(', ') : null,
    fields.feel ? `overall feel: ${fields.feel}` : null,
  ].filter(Boolean)

  return `Create a candid, authentic smartphone self-portrait photograph that feels genuinely captured in the moment — not directed, not styled, not produced.

Character: ${charParts.join('. ')}.

Scene: The character is photographing themselves in front of a stark white backdrop.

Shot: Close selfie-style framing — face and upper chest filling most of the frame, chin to just above the crown, shoulders visible at the bottom edge. No hands, arms, or phone visible in frame at any point. The crop should be tight enough that there is no room for limbs to appear. Face should sit slightly off-centre — drifted left or right of middle, with the background visible more on one side. Slight upward tilt, natural and candid. Do not centre the face symmetrically in the frame.

Camera feel: Smartphone camera simulation. 28–35mm equivalent. Slight front-camera softness. Background softly out of focus but fully readable. No film grain, no format simulation.

Lighting: Natural indoor light from the side creating clear directional illumination with genuine contrast. Deep warm shadows under the chin, neck and jawline. Skin luminous and warm on the lit side. Background slightly brighter than face.

Expression: Genuine, relaxed, mid-moment. Natural smile or soft open expression — approachable, confident, real.

Avoid: Hands or arms in frame, phone visible, face appearing small in frame, flat even lighting, excessive shadows, lifted shadows, overexposed face, cool grey skin tones, editorial styling, heavy makeup, film grain, logos or text, overly warm colour temperature.`
}

// ─── Random name generator ────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Amara','Billie','Cleo','Dana','Elena','Fran','Grace','Harper','Iris','Jules',
  'Kai','Lena','Maya','Nadia','Olive','Priya','Quinn','Rosa','Sage','Tara',
  'Uma','Vera','Wren','Xena','Yara','Zoe','Alex','Blake','Casey','Drew',
  'Evan','Finley','Glen','Hayden','Indigo','Jordan','Kendall','Lane','Morgan',
  'Noah','Owen','Parker','Reese','Sam','Taylor','Uma','Val','Winter','Yael',
]
const LAST_NAMES = [
  'Adeyemi','Banks','Chen','Delacroix','Ellis','Ferreira','Gomez','Hassan',
  'Ibrahim','Jensen','Kwan','Larsson','Mwangi','Nguyen','Okafor','Patel',
  'Quinn','Reyes','Santos','Tanaka','Ueda','Vargas','Walsh','Xu','Yamamoto',
]
function randomName() {
  const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return `${f} ${l}`
}

// ─── Options ─────────────────────────────────────────────────────────────────
const AGES = ['Early twenties','Mid twenties','Late twenties','Early thirties','Mid thirties','Late thirties','Early forties','Mid forties','Late forties','Early fifties','Mid fifties','Early sixties','Late sixties']
const GENDERS = ['Woman','Man','Non-binary person']
const ETHNICITIES = ['White European','Black British','Black American','South Asian','East Asian','Latin American','Middle Eastern','Mixed heritage','Indigenous Australian','Pacific Islander','Other...']
const HAIR_LENGTHS = ['Shaved','Very short / cropped','Short','Chin length','Shoulder length','Long','Natural / afro','Locs','Braids']
const HAIR_COLOURS = ['Black','Dark brown','Medium brown','Light brown','Dirty blonde','Blonde','Platinum blonde with dark roots','Auburn / red','Grey / silver','White','Highlights','Vivid colour','Custom...']
const RANDOM_HAIR_COLOURS = ['Hot pink with dark roots','Pastel lavender, faded','Electric blue, vivid','Bright copper red','Emerald green tips','Two-tone: black and platinum blonde','Bubblegum pink, grown out','Deep violet with highlights','Strawberry blonde','Bleached white with yellow tones','Neon orange','Teal with dark underlayer']
const HAIR_TEXTURES = ['Straight','Slight wave','Wavy','Curly','Coily','Tousled','Sleek']
const EYE_COLOURS = ['Brown','Dark brown','Hazel','Green','Blue','Grey']
const CLOTHING_OPTIONS = ['Dark charcoal grey ribbed turtleneck','Navy blue crewneck sweatshirt','Burnt orange linen shirt','Olive green linen top','White fitted t-shirt','Black v-neck tee','Rust red knit sweater','Forest green ribbed sweater','Camel blazer','Denim jacket','Custom...']
const RANDOM_CLOTHING = ['Vintage band tee, faded and worn','Oversized hoodie in sage green','Floral silk blouse','Chunky cable knit cream sweater','Striped Breton top, navy and white','Acid wash denim jacket','Terracotta linen blazer','Athletic zip-up, heather grey','Sheer white linen shirt','Bold geometric print shirt']
const EARRING_OPTIONS = ['Small silver hoop earrings','Small gold hoop earrings','Gold stud earrings','Silver stud earrings']
const NECKLACE_OPTIONS = ['Fine silver chain necklace','Fine gold chain necklace']
const GLASSES_OPTIONS = ['Tortoiseshell glasses','Wire-frame glasses','Black-frame glasses','No glasses']
const FEATURES = ['Nose stud','Light stubble','Full beard','Freckles','Natural laughter lines','Visible tattoos','Septum ring','Bold brows']


// ─── Business vertical clothing ──────────────────────────────────────────────
const VERTICALS = ['Construction', 'Ecommerce / Fashion', 'Hairdressing', 'Café Owner', 'Freelancer']

const VERTICAL_CLOTHING = {
  'Construction': [
    'Hi-vis orange vest over a white fitted tee, work shorts',
    'Hi-vis yellow vest over a navy flannel shirt, worn jeans',
    'Hi-vis orange long-sleeve shirt, dusty work pants, steel cap boots',
    'Hi-vis vest over a grey tee, tool belt visible at waist',
    'Faded hi-vis shirt with sleeves rolled up, cargo shorts',
  ],
  'Ecommerce / Fashion': [
    'Relaxed white linen shirt, clean minimal style',
    'Oversized cream knit, straight leg trousers — understated and chic',
    'Simple black turtleneck, silver jewellery',
    'Soft floral midi dress, effortless and natural',
    'Neutral toned co-ord set, casual but considered',
  ],
  'Hairdressing': [
    'All-black uniform — fitted black top, black trousers, black apron',
    'Sleek black tunic top, black joggers, minimal jewellery',
    'Black fitted t-shirt with black utility apron, small scissors holster',
    'Smart black polo with salon logo area, slim black pants',
    'Black wrap-style top, black fitted trousers, hair clips on apron',
  ],
  'Café Owner': [
    'Worn canvas apron over a plain white tee, jeans',
    'Denim apron over a striped long sleeve shirt',
    'Black barista apron over a black tee, small tattoos visible',
    'Olive green apron over a cream linen shirt, sleeves rolled',
    'Classic white café apron over a simple navy tee',
  ],
  'Freelancer': [
    'Relaxed oversized hoodie in sage green, casual and comfortable',
    'Soft grey marl sweatshirt, minimal and unfussy',
    'Simple white tee, open linen shirt over the top, relaxed fit',
    'Cosy cream ribbed knit, minimal jewellery',
    'Navy crewneck sweatshirt, lived-in and comfortable',
  ],
}

const VERTICAL_EXTRAS = {
  'Construction': ['Sun-weathered complexion','Safety glasses pushed up on forehead','Fine dust or plaster on clothing','Calloused hands visible at collar','Slight tan line at collar','Work gloves tucked into pocket'],
  'Ecommerce / Fashion': ['Manicured nails','Subtle statement earrings','Stylish minimal watch','Lip gloss','Hair perfectly styled'],
  'Hairdressing': ['Scissors clipped to apron','Hair clips visible on apron or collar','Latex gloves rolled down at wrist','Slight colour stain on fingertips','Sleek professional makeup'],
  'Café Owner': ['Slight flour or coffee on apron','Pen tucked behind ear','Tired but warm expression','Slight coffee stain on sleeve','Early morning look — beanie, minimal'],
  'Freelancer': ['Headphones around neck','Relaxed natural makeup or no makeup','Reading glasses pushed up','Slightly dishevelled creative energy','Cosy indoor look'],
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickN(arr, n) { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n) }

const DEFAULT = {
  age: 'Mid thirties', gender: 'Woman', ethnicity: 'White European',
  hairLength: 'Short', hairColour: 'Platinum blonde with dark roots', hairTexture: 'Tousled',
  eyes: 'Green',
  clothing: 'Dark charcoal grey ribbed turtleneck', feel: '',
}

const S = {
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 24, display: 'block' },
  select: { width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: 'inherit', background: '#fff', color: '#1A2B4A', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: 'inherit', background: '#fff', color: '#1A2B4A', boxSizing: 'border-box', minHeight: 72, resize: 'vertical', lineHeight: 1.6 },
  input: { width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: 'inherit', background: '#fff', color: '#1A2B4A', boxSizing: 'border-box' },
}

function Btn({ children, primary, disabled, onClick, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '9px 20px', fontSize: 14, borderRadius: 6,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', fontWeight: primary ? 500 : 400,
      background: primary ? '#13B5EA' : '#fff',
      border: primary ? '1px solid #13B5EA' : '1px solid #E2E8F0',
      color: primary ? '#fff' : '#1A2B4A',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', ...style,
    }}>{children}</button>
  )
}

function ToggleGroup({ options, selected, onToggle, multi = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : selected === opt
        return (
          <div key={opt} onClick={() => onToggle(opt)} style={{
            padding: '6px 12px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
            border: active ? '1px solid #13B5EA' : '1px solid #E2E8F0',
            background: active ? '#E8F6FD' : '#fff',
            color: active ? '#0C7ABF' : '#4A5568',
            fontWeight: active ? 500 : 400,
            userSelect: 'none', transition: 'all 0.1s',
          }}>{opt}</div>
        )
      })}
    </div>
  )
}

function Notice({ children, error }) {
  return (
    <div style={{
      background: error ? '#FDEDEC' : '#F7F9FC',
      border: `1px solid ${error ? '#E74C3C' : '#E2E8F0'}`,
      borderRadius: 6, padding: '10px 14px', fontSize: 13,
      color: error ? '#C0392B' : '#4A5568',
      display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: error ? '#E74C3C' : '#13B5EA', marginTop: 4, flexShrink: 0 }} />
      {children}
    </div>
  )
}

function Steps({ current }) {
  const steps = ['Character', 'Generate', 'Save']
  return (
    <div style={{ display: 'flex', marginBottom: 32, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
      {steps.map((label, i) => {
        const n = i + 1; const active = n === current; const done = n < current
        return (
          <div key={n} style={{
            flex: 1, padding: '10px 14px', fontSize: 13,
            color: active ? '#1A2B4A' : '#4A5568',
            background: active ? '#fff' : '#F7F9FC',
            borderRight: i < 2 ? '1px solid #E2E8F0' : 'none',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: active ? 500 : 400,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: active ? '#13B5EA' : done ? '#EAF7EF' : '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500,
              color: active ? '#fff' : done ? '#27AE60' : '#4A5568',
            }}>{done ? '✓' : n}</div>
            {label}
          </div>
        )
      })}
    </div>
  )
}

export default function CreateAvatar() {
  const [step, setStep] = useState(1)
  const [fields, setFields] = useState(DEFAULT)
  const [features, setFeatures] = useState(['Nose stud'])
  const [accessories, setAccessories] = useState(['Small silver hoop earrings', 'Fine silver chain necklace'])
  const [promptOpen, setPromptOpen] = useState(false)
  const [customHairColour, setCustomHairColour] = useState('')
  const [customClothing, setCustomClothing] = useState('')
  const [customEthnicity, setCustomEthnicity] = useState('')
  const [clothingMode, setClothingMode] = useState('standard') // 'standard' | 'vertical'
  const [selectedVertical, setSelectedVertical] = useState('Construction')

  const [genStatus, setGenStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [outputs, setOutputs] = useState([])
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [enlargedOutput, setEnlargedOutput] = useState(null)

  // Save step
  const [avatarName, setAvatarName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const pollRef = useRef(null)

  const setSingle = (key, val) => setFields(f => ({ ...f, [key]: val }))
  const setSelect = (key) => (e) => setFields(f => ({ ...f, [key]: e.target.value }))
  const toggleMulti = (arr, setArr, val) => setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  function doRandomise() {
    setFields({
      age: pick(AGES), gender: pick(GENDERS), ethnicity: pick(ETHNICITIES),
      hairLength: pick(HAIR_LENGTHS), hairColour: pick(HAIR_COLOURS), hairTexture: pick(HAIR_TEXTURES),
      eyes: pick(EYE_COLOURS), clothing: pick(CLOTHING_OPTIONS), feel: '',
    })
    setFeatures(pickN(FEATURES, Math.floor(Math.random() * 3)))
    const randomEarrings = Math.random() > 0.3 ? [pick(EARRING_OPTIONS)] : []
    const randomNecklace = Math.random() > 0.5 ? [pick(NECKLACE_OPTIONS)] : []
    const randomGlasses = Math.random() > 0.5 ? [pick(GLASSES_OPTIONS.slice(0, 3))] : ['No glasses']
    setAccessories([...randomEarrings, ...randomNecklace, ...randomGlasses])
  }

  const prompt = buildPrompt(fields, features, accessories, customHairColour, customClothing, customEthnicity)

  async function startGeneration() {
    setGenStatus('running')
    setProgress(0)
    setOutputs([])
    setSelectedOutput(null)
    setProgressLabel('Starting generation run...')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      pollRef.current = setInterval(() => pollStatus(data.runId), 3000)
    } catch (err) {
      setGenStatus('error')
      setProgressLabel('Error: ' + err.message)
    }
  }

  async function pollStatus(id) {
    try {
      const res = await fetch(`/api/poll?runId=${id}`)
      const data = await res.json()
      setProgress(data.progress ?? 0)
      if (data.status === 'running' || data.status === 'pending') {
        setProgressLabel(`Generating... ${data.progress ?? 0}%`)
      }
      if (data.status === 'completed') {
        clearInterval(pollRef.current)
        setGenStatus('done')
        setProgress(100)
        setProgressLabel('Generation complete — select your best output')
        setOutputs(data.outputs ?? [])
      }
      if (data.status === 'failed') {
        clearInterval(pollRef.current)
        setGenStatus('error')
        setProgressLabel(`Generation failed: ${data.errorMessage || 'unknown error'}`)
      }
    } catch (err) { console.error('Poll error:', err) }
  }

  function proceedToSave() {
    setAvatarName(randomName())
    setStep(3)
  }

  async function saveToLibrary() {
    if (!avatarName.trim()) return
    setSaving(true)
    const output = outputs[selectedOutput]
    await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'avatars',
        entry: {
          name: avatarName.trim(),
          avatarUrl: output?.url ?? null,
          characterSheet: null,
          meta: {
            age: fields.age,
            gender: fields.gender,
            ethnicity: fields.ethnicity === 'Other...' ? customEthnicity : fields.ethnicity,
            hair: `${fields.hairLength} ${(fields.hairColour === 'Custom...' ? customHairColour : fields.hairColour).toLowerCase()}`,
            clothing: fields.clothing === 'Custom...' ? customClothing : fields.clothing,
          },
        },
      }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <>
      <Head>
        <title>Create Avatar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A2B4A' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#13B5EA' }} />
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Create avatar</h1>
            </div>
            <p style={{ fontSize: 14, color: '#4A5568', paddingLeft: 20, margin: 0 }}>Generate a new AI character</p>
          </div>
          <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
            ← Home
          </Link>
        </div>

        <Steps current={step} />

        {/* ── Step 1: Character ─────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Btn onClick={doRandomise} style={{ fontSize: 13 }}>⚄ Randomise</Btn>
            </div>

            <span style={S.sectionLabel}>Gender</span>
            <ToggleGroup options={GENDERS} selected={fields.gender} onToggle={v => setSingle('gender', v)} />

            <span style={S.sectionLabel}>Age range</span>
            <select style={S.select} value={fields.age} onChange={setSelect('age')}>
              {AGES.map(o => <option key={o}>{o}</option>)}
            </select>

            <span style={S.sectionLabel}>Ethnicity</span>
            <ToggleGroup options={ETHNICITIES} selected={fields.ethnicity} onToggle={v => setSingle('ethnicity', v)} />
            {fields.ethnicity === 'Other...' && (
              <input
                type="text"
                placeholder="Type a custom ethnicity"
                value={customEthnicity}
                onChange={e => setCustomEthnicity(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: 6,
                  padding: '6px 12px', fontSize: 13, borderRadius: 6,
                  border: '1px solid #13B5EA', background: '#E8F6FD',
                  color: '#4A5568', outline: 'none',
                }}
              />
            )}

            <span style={S.sectionLabel}>Hair length</span>
            <ToggleGroup options={HAIR_LENGTHS} selected={fields.hairLength} onToggle={v => setSingle('hairLength', v)} />

            <span style={S.sectionLabel}>Hair colour</span>
            <ToggleGroup options={HAIR_COLOURS} selected={fields.hairColour} onToggle={v => setSingle('hairColour', v)} />
            {fields.hairColour === 'Custom...' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  value={customHairColour}
                  onChange={e => setCustomHairColour(e.target.value)}
                  placeholder="e.g. hot pink with dark roots, pastel lavender..."
                />
                <Btn onClick={() => setCustomHairColour(RANDOM_HAIR_COLOURS[Math.floor(Math.random() * RANDOM_HAIR_COLOURS.length)])} style={{ fontSize: 13, flexShrink: 0 }}>
                  ⚄ Random
                </Btn>
              </div>
            )}

            <span style={S.sectionLabel}>Hair texture</span>
            <ToggleGroup options={HAIR_TEXTURES} selected={fields.hairTexture} onToggle={v => setSingle('hairTexture', v)} />

            <span style={S.sectionLabel}>Eye colour</span>
            <ToggleGroup options={EYE_COLOURS} selected={fields.eyes} onToggle={v => setSingle('eyes', v)} />

            <span style={S.sectionLabel}>Clothing</span>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['standard', 'vertical'].map(m => (
                <button key={m} onClick={() => setClothingMode(m)} style={{
                  padding: '6px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: clothingMode === m ? 500 : 400,
                  background: clothingMode === m ? '#1A2B4A' : '#fff',
                  border: clothingMode === m ? '1px solid #1A2B4A' : '1px solid #E2E8F0',
                  color: clothingMode === m ? '#fff' : '#4A5568',
                }}>
                  {m === 'standard' ? 'Standard' : 'Business vertical'}
                </button>
              ))}
            </div>

            {clothingMode === 'standard' && (
              <div>
                <ToggleGroup options={CLOTHING_OPTIONS} selected={fields.clothing} onToggle={v => setSingle('clothing', v)} />
                {fields.clothing === 'Custom...' && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...S.input, flex: 1 }}
                      value={customClothing}
                      onChange={e => setCustomClothing(e.target.value)}
                      placeholder="e.g. vintage band tee, faded and worn..."
                    />
                    <Btn onClick={() => setCustomClothing(RANDOM_CLOTHING[Math.floor(Math.random() * RANDOM_CLOTHING.length)])} style={{ fontSize: 13, flexShrink: 0 }}>
                      ⚄ Random
                    </Btn>
                  </div>
                )}
              </div>
            )}

            {clothingMode === 'vertical' && (
              <div>
                {/* Vertical selector */}
                <ToggleGroup options={VERTICALS} selected={selectedVertical} multi={false} onToggle={v => {
                  setSelectedVertical(v)
                  const options = VERTICAL_CLOTHING[v]
                  setCustomClothing(options[Math.floor(Math.random() * options.length)])
                  setSingle('clothing', 'Custom...')
                }} />
                {/* Description textbox */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    value={customClothing}
                    onChange={e => setCustomClothing(e.target.value)}
                    placeholder="Select a vertical above to populate..."
                  />
                  <Btn onClick={() => {
                    const options = VERTICAL_CLOTHING[selectedVertical]
                    setCustomClothing(options[Math.floor(Math.random() * options.length)])
                    setSingle('clothing', 'Custom...')
                  }} style={{ fontSize: 13, flexShrink: 0 }}>
                    ⚄ Random
                  </Btn>
                </div>
              </div>
            )}

            <span style={S.sectionLabel}>Accessories</span>

            <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 6, marginTop: 4 }}>Earrings <span style={{ opacity: 0.6 }}>— select one or none</span></div>
            <ToggleGroup options={EARRING_OPTIONS} selected={accessories} multi={true} onToggle={v => {
              // Only allow one earring at a time
              const otherAccessories = accessories.filter(a => !EARRING_OPTIONS.includes(a))
              if (accessories.includes(v)) {
                setAccessories(otherAccessories)
              } else {
                setAccessories([...otherAccessories, v])
              }
            }} />

            <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 6, marginTop: 12 }}>Necklace <span style={{ opacity: 0.6 }}>— select one or none</span></div>
            <ToggleGroup options={NECKLACE_OPTIONS} selected={accessories} multi={true} onToggle={v => {
              const otherAccessories = accessories.filter(a => !NECKLACE_OPTIONS.includes(a))
              if (accessories.includes(v)) {
                setAccessories(otherAccessories)
              } else {
                setAccessories([...otherAccessories, v])
              }
            }} />

            <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 6, marginTop: 12 }}>Glasses <span style={{ opacity: 0.6 }}>— select one</span></div>
            <ToggleGroup options={GLASSES_OPTIONS} selected={accessories} multi={true} onToggle={v => {
              // Only allow one glasses option at a time
              const otherAccessories = accessories.filter(a => !GLASSES_OPTIONS.includes(a))
              setAccessories([...otherAccessories, v])
            }} />

            <span style={S.sectionLabel}>Distinctive features <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— select all that apply</span></span>
            <ToggleGroup options={FEATURES} selected={features} multi={true} onToggle={v => toggleMulti(features, setFeatures, v)} />

            <span style={S.sectionLabel}>Extras <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional, anything additional to add</span></span>
            {clothingMode === 'vertical' && VERTICAL_EXTRAS[selectedVertical] && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 6 }}>Suggestions for {selectedVertical} <span style={{ opacity: 0.6 }}>— click to add</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {VERTICAL_EXTRAS[selectedVertical].map(suggestion => (
                    <div key={suggestion} onClick={() => {
                      const current = fields.feel.trim()
                      setSingle('feel', current ? `${current}, ${suggestion.toLowerCase()}` : suggestion.toLowerCase())
                    }} style={{
                      padding: '5px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                      border: '1px solid #E2E8F0', background: '#F7F9FC', color: '#4A5568',
                      userSelect: 'none', transition: 'all 0.1s',
                    }}>
                      + {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <textarea style={S.textarea} value={fields.feel} onChange={e => setSingle('feel', e.target.value)} placeholder="e.g. full sleeve tattoo on left arm, prominent scar on chin, septum piercing..." />

            <div style={{ marginTop: 20, marginBottom: 4 }}>
              <button onClick={() => setPromptOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4A5568', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10 }}>{promptOpen ? '▼' : '▶'}</span>
                View assembled prompt
              </button>
            </div>
            {promptOpen && (
              <pre style={{ background: '#F7F9FC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px 16px', fontSize: 12, lineHeight: 1.7, color: '#4A5568', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 280, overflowY: 'auto', margin: '8px 0 0' }}>{prompt}</pre>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn primary onClick={() => { setStep(2); setGenStatus('idle') }}>Generate avatar →</Btn>
            </div>
          </div>
        )}

        {/* ── Step 2: Generate ──────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            {genStatus === 'idle' && <Notice>Ready to generate. Flora will return 4 avatar outputs.</Notice>}
            {genStatus === 'error' && <Notice error>{progressLabel}</Notice>}

            {genStatus !== 'idle' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#13B5EA', borderRadius: 2, width: `${progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4A5568' }}>
                  <span>{progressLabel}</span><span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[0, 1, 2, 3].map(i => {
                const output = outputs[i]; const isSelected = selectedOutput === i
                return (
                  <div key={i} onClick={() => output && setSelectedOutput(i)} style={{
                    aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                    border: isSelected ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                    background: '#F7F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: output ? 'pointer' : 'default', position: 'relative',
                    animation: genStatus === 'running' && !output ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}>
                    {output?.url
                      ? <img src={output.url} alt={`Output ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 12, color: '#4A5568' }}>{genStatus === 'running' ? 'Generating...' : `Output ${i + 1}`}</span>
                    }
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    {output?.url && (
                      <div onClick={e => { e.stopPropagation(); setEnlargedOutput(output.url) }} style={{
                        position: 'absolute', bottom: 8, right: 8, width: 28, height: 28,
                        borderRadius: 6, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 1h4v4M5 8L12 1M1 5V1h4M5 5L1 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {enlargedOutput && (
              <div onClick={() => setEnlargedOutput(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
                <img src={enlargedOutput} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Btn onClick={() => setStep(1)}>← Edit character</Btn>
              {genStatus === 'idle' || genStatus === 'error'
                ? <Btn primary onClick={startGeneration}>Start generation</Btn>
                : genStatus === 'done'
                  ? <Btn primary disabled={selectedOutput === null} onClick={proceedToSave}>{selectedOutput === null ? 'Select an output first' : 'Continue →'}</Btn>
                  : <Btn primary disabled>Generating...</Btn>
              }
            </div>
          </div>
        )}

        {/* ── Step 3: Save ──────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            {saved ? (
              <div>
                <Notice>Avatar saved to library successfully.</Notice>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <Link href="/library" style={{
                    padding: '9px 20px', fontSize: 14, borderRadius: 6, fontWeight: 500,
                    background: '#13B5EA', border: '1px solid #13B5EA', color: '#fff',
                    textDecoration: 'none', display: 'inline-block',
                  }}>View library →</Link>
                  <Btn onClick={() => { setStep(1); setGenStatus('idle'); setOutputs([]); setSelectedOutput(null); setSaved(false) }}>
                    Create another
                  </Btn>
                </div>
              </div>
            ) : (
              <div>
                {/* Preview */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
                  <div style={{ width: 90, height: 112, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #13B5EA', flexShrink: 0 }}>
                    {outputs[selectedOutput]?.url && (
                      <img src={outputs[selectedOutput].url} alt="Selected avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 4 }}>{fields.age} · {fields.gender} · {fields.ethnicity === 'Other...' ? customEthnicity || 'Other' : fields.ethnicity}</div>
                    <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 4 }}>{fields.hairLength} {fields.hairColour.toLowerCase()} hair</div>
                    <div style={{ fontSize: 13, color: '#4A5568' }}>{fields.clothing}</div>
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#4A5568', marginBottom: 6 }}>
                    Character name
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      style={{ ...S.input, flex: 1 }}
                      value={avatarName}
                      onChange={e => setAvatarName(e.target.value)}
                      placeholder="Enter a name..."
                    />
                    <Btn onClick={() => setAvatarName(randomName())} style={{ fontSize: 13, flexShrink: 0 }}>
                      ⚄ Random name
                    </Btn>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Btn onClick={() => setStep(2)}>← Back</Btn>
                  <Btn primary disabled={!avatarName.trim() || saving} onClick={saveToLibrary}>
                    {saving ? 'Saving...' : 'Save to library →'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box}select:focus,textarea:focus,input:focus{outline:2px solid #13B5EA;outline-offset:1px}`}</style>
    </>
  )
}
