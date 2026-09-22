(function () {
  "use strict";

  const imageRoot = "/assets/tervona-products/catalog-v2";
  const categoryScene = "/assets/tervona-products/category-scene-tervona-v2.png";
  const lowVoltageBatteryImage = `${imageRoot}/battery-5-kwh-cutout.png`;
  const ecoLinkImage = `${imageRoot}/ecolink-series-cutout.png`;
  const allInOneImage = `${imageRoot}/aio-500w-1kwh-cutout.png`;
  const offGridImage = `${imageRoot}/off-grid-single-phase-cutout.png`;

  const categoryLabels = {
    "low-voltage-battery": "Low-Voltage Batteries",
    "hybrid-inverter": "Low-Voltage Hybrid Inverters",
    "off-grid-inverter": "Single-Phase Off-Grid Inverters",
    "all-in-one-ess": "All-in-One Energy Storage",
  };

  function productRecord({
    slug,
    category,
    title,
    productType,
    rangeLabel,
    summary,
    image,
    stats,
    eyebrow,
    advantagesTitle,
    advantagesBody,
    highlights,
    datasheetUrl,
  }) {
    const path = `/products/${category}/${slug}`;
    return {
      id: path,
      path,
      title,
      category,
      categoryLabel: categoryLabels[category],
      productType,
      rangeLabel,
      summary,
      heroText: summary,
      heroImage: image,
      bannerImage: image,
      listImage: image,
      status: "Published",
      stats,
      advantagesEyebrow: eyebrow,
      advantagesTitle,
      advantagesBody,
      advantagesImage: image,
      highlights,
      datasheetUrl,
      seoTitle: `${title} | Tervona`,
      seoDescription: summary,
    };
  }

  function batteryProduct(config) {
    const { slug, designation, form, image, model, energy, voltage, capacity, chargeCurrent, dischargeCurrent, size, weight, familyOnly, datasheetUrl } = config;
    const title = `${designation} ${form} Low-Voltage Battery`;
    const sourceEnergy = energy || designation;
    const summary = familyOnly
      ? `A ${designation} floor-standing LiFePO4 battery configuration in Tervona's low-voltage storage range.`
      : `${model} is a ${sourceEnergy} ${form.toLowerCase()} LiFePO4 battery with ${voltage} nominal voltage, ${capacity} rated capacity and RS485/CAN communication.`;
    const highlights = familyOnly
      ? [
          { title: `${designation} storage configuration`, body: `The supplied standing-battery family lists ${designation} among its available energy configurations.` },
          { title: "LiFePO4 battery family", body: "Battery chemistry: lithium iron phosphate (LiFePO4)." },
          { title: "Broad inverter compatibility", body: "The supplied family presentation states compatibility with more than 20 mainstream inverter platforms." },
          { title: "Multilingual display", body: "The supplied family presentation lists multilingual display switching." },
        ]
      : [
          { title: `${sourceEnergy} LiFePO4 battery`, body: `${voltage} nominal voltage and ${capacity} rated capacity.` },
          { title: "Charge and discharge current", body: `${chargeCurrent} maximum charge current; ${dischargeCurrent} maximum discharge current.` },
          { title: "RS485 / CAN communication", body: "The product parameter sheet lists RS485 and CAN communication interfaces." },
          { title: `${size} enclosure`, body: `Product size: ${size}; approximate weight: ${weight}.` },
        ];
    return productRecord({
      slug: slug,
      category: "low-voltage-battery",
      title,
      productType: `${form.toUpperCase()} LIFEPO4 BATTERY`,
      rangeLabel: designation,
      summary,
      image,
      stats: [
        { label: familyOnly ? "Storage Configuration" : "Battery Energy", value: sourceEnergy },
        { label: familyOnly ? "Installation Format" : "Rated Capacity", value: familyOnly ? form : capacity },
      ],
      eyebrow: `${form} LiFePO4 Battery`,
      advantagesTitle: familyOnly ? `${designation} floor-standing storage` : `${designation} low-voltage energy storage`,
      advantagesBody: familyOnly
        ? `This ${designation} configuration belongs to the supplied floor-standing LiFePO4 family, which is presented with 10 kW inverter support, compatibility with more than 20 mainstream inverter platforms and multilingual display switching.`
        : `${model} combines ${sourceEnergy} of LiFePO4 storage with ${voltage} nominal voltage, ${capacity} rated capacity and RS485/CAN communication in a ${form.toLowerCase()} enclosure.`,
      highlights,
      datasheetUrl,
    });
  }

  function ecoLinkProduct(config) {
    const { slug, power, modelCode, maxPvInput, batteryCurrent, batteryPower } = config;
    const title = `EcoLink ${power} Low-Voltage Single-Phase Hybrid Inverter`;
    const summary = `${modelCode} is a ${power} EcoLink single-phase low-voltage hybrid inverter with ${maxPvInput} maximum PV input, dual MPPT, IP65 protection and backup switching of 10 ms or less.`;
    return productRecord({
      slug: slug,
      category: "hybrid-inverter",
      title,
      productType: "SINGLE-PHASE LOW-VOLTAGE HYBRID INVERTER",
      rangeLabel: power,
      summary,
      image: ecoLinkImage,
      stats: [
        { label: "Rated AC Output", value: power },
        { label: "Ingress Protection", value: "IP65" },
      ],
      eyebrow: "EcoLink Series",
      advantagesTitle: `${power} single-phase low-voltage hybrid inverter`,
      advantagesBody: `${modelCode} combines a 42–59 V battery interface, dual MPPT inputs, IP65 ingress protection and backup switching of 10 ms or less. The supplied EcoLink material also lists an optional integrated 7 kW AC charger, smart port and remote operation and maintenance.`,
      highlights: [
        { title: `${batteryCurrent} battery current`, body: `Maximum charge/discharge current: ${batteryCurrent}; maximum battery charge/discharge power: ${batteryPower}.` },
        { title: "Dual MPPT PV input", body: `${maxPvInput} maximum PV input, 90–530 V MPPT range and two MPPT trackers.` },
        { title: "≤10 ms backup switching", body: `${power} nominal EPS output with automatic switching in 10 ms or less and peak output up to twice rated power for 10 seconds.` },
        { title: "IP65 and 97% max efficiency", body: "IP65 enclosure, 97% maximum PV-to-AC efficiency, RS485/CAN and optional Wi-Fi via USB." },
      ],
      datasheetUrl: "/uploads/downloads/ecolink-3-6kw-8kw-hybrid-inverter-datasheet.pdf",
    });
  }

  function offGridProduct(slug, power, datasheetUrl) {
    const title = `${power} IP54 Single-Phase Off-Grid Inverter`;
    const summary = `A ${power} single-phase off-grid inverter with an IP54 designation.`;
    return productRecord({
      slug,
      category: "off-grid-inverter",
      title,
      productType: "SINGLE-PHASE OFF-GRID INVERTER",
      rangeLabel: `${power} · IP54`,
      summary,
      image: offGridImage,
      stats: [
        { label: "Power Class", value: power },
        { label: "Ingress Designation", value: "IP54" },
      ],
      eyebrow: "Single-Phase Off-Grid Inverter",
      advantagesTitle: `${power} power class with IP54 designation`,
      advantagesBody: `${title} combines the confirmed ${power} power class, single-phase architecture and IP54 designation.`,
      highlights: [
        { title: `${power} power class`, body: `Product power class: ${power}.` },
        { title: "Single-phase", body: "Phase category: single-phase." },
        { title: "IP54 designation", body: "Ingress designation: IP54." },
        { title: "Off-grid inverter", body: "Product category: off-grid inverter." },
      ],
      datasheetUrl,
    });
  }

  function allInOneProduct(config) {
    const { slug, output, storage, image, family, model, voltage, capacity, pvPower, mppt, pvCurrent, transfer, size, weight, datasheetUrl } = config;
    const rating = `${output} / ${storage}`;
    const title = `${rating} All-in-One Energy Storage System`;
    const mini = family === "mini";
    const summary = mini
      ? `${model} combines ${storage} of LiFePO4 storage, ${output} pure-sine-wave AC output and PV/grid charging in one compact system.`
      : `${model} is a floor-standing ${rating} system combining a LiFePO4 battery, inverter, PV/AC charging and UPS functionality.`;
    const highlights = [
      { title: `${storage} LiFePO4 battery`, body: `${voltage} nominal voltage and ${capacity} rated capacity.` },
      { title: `${pvPower} PV input`, body: `Maximum PV input power: ${pvPower}; MPPT voltage range: ${mppt}; maximum PV input current: ${pvCurrent}.` },
      { title: `${output} pure sine wave output`, body: `${output} rated AC output at 230 Vac${transfer ? ` with transfer time below ${transfer}` : ""}.` },
      { title: mini ? "PV, grid and AC/DC operation" : "Integrated PV/AC charging and UPS", body: mini ? `Supports PV and grid charging, AC/DC output and fast charging. Product size: ${size}; approximate weight: ${weight}.` : `RS485/Wi-Fi communication. Product size: ${size}; approximate weight: ${weight}.` },
    ];
    return productRecord({
      slug: slug,
      category: "all-in-one-ess",
      title,
      productType: "ALL-IN-ONE ENERGY STORAGE SYSTEM",
      rangeLabel: rating,
      summary,
      image,
      stats: [
        { label: "Rated Output", value: output },
        { label: "Battery Energy", value: storage },
      ],
      eyebrow: "All-in-One Energy Storage",
      advantagesTitle: `${rating} integrated energy storage`,
      advantagesBody: mini
        ? `This ${rating} configuration combines a LiFePO4 battery, pure-sine-wave AC output, PV and grid charging, AC/DC output and fast-charging support.`
        : `This ${rating} configuration combines a LiFePO4 battery and inverter in a floor-standing system with integrated PV/AC charging and UPS functionality.`,
      highlights,
      datasheetUrl,
    });
  }

  const products = [
    batteryProduct({ slug: "5-kwh-rack-mount", designation: "5 kWh", form: "Rack-Mount", image: `${imageRoot}/battery-5-kwh-cutout.png`, model: "IYP-RM51100A-A1", energy: "5.12 kWh", voltage: "48 / 51.2 V", capacity: "100 Ah", chargeCurrent: "100 A", dischargeCurrent: "100 A", size: "442 × 420 × 133 mm", weight: "43 / 45 kg", datasheetUrl: "/uploads/downloads/lst-5-12kwh-16kwh-rack-mount-lifepo4-battery-datasheet.pdf" }),
    batteryProduct({ slug: "7-5-kw-rack-mount", designation: "7.5 kWh", form: "Rack-Mount", image: `${imageRoot}/battery-7-5-kw-cutout.png`, model: "IYP-RM51150A-A1", energy: "7.5 kWh", voltage: "48 / 51.2 V", capacity: "150 Ah", chargeCurrent: "150 A", dischargeCurrent: "150 A", size: "442 × 450 × 168 mm", weight: "63 / 66 kg", datasheetUrl: "/uploads/downloads/lst-5-12kwh-16kwh-rack-mount-lifepo4-battery-datasheet.pdf" }),
    batteryProduct({ slug: "10-kwh-floor-standing", designation: "10 kWh", form: "Floor-Standing", image: `${imageRoot}/battery-10-kwh-cutout.png`, model: "IYP-RM51206A-A1", energy: "10.5 kWh", voltage: "48 / 51.2 V", capacity: "206 Ah", chargeCurrent: "200 A", dischargeCurrent: "200 A", size: "442 × 420 × 266 mm", weight: "85 / 88 kg" }),
    batteryProduct({ slug: "16-kwh-floor-standing", designation: "16 kWh", form: "Floor-Standing", image: `${imageRoot}/battery-16-kwh-cutout.png`, model: "IYP-ST51314A-M1", energy: "16 kWh", voltage: "51.2 V", capacity: "314 Ah", chargeCurrent: "100 / 200 A", dischargeCurrent: "200 A", size: "470 × 250 × 690 mm", weight: "110 kg", datasheetUrl: "/uploads/downloads/lsk-16kwh-standing-lifepo4-battery-datasheet.pdf" }),
    batteryProduct({ slug: "32-kwh-floor-standing", designation: "32 kWh", form: "Floor-Standing", image: `${imageRoot}/battery-32-kwh-cutout.png`, familyOnly: true, datasheetUrl: "/uploads/downloads/lsk-16kwh-standing-lifepo4-battery-datasheet.pdf" }),

    ecoLinkProduct({ slug: "ecolink-3-6-kw", power: "3.6 kW", modelCode: "HYB-3K6LSG-01-TVN", maxPvInput: "7.2 kW", batteryCurrent: "83 A", batteryPower: "4.0 kW" }),
    ecoLinkProduct({ slug: "ecolink-4-6-kw", power: "4.6 kW", modelCode: "HYB-4K6LSG-01-TVN", maxPvInput: "9.2 kW", batteryCurrent: "104 A", batteryPower: "5.0 kW" }),
    ecoLinkProduct({ slug: "ecolink-5-kw", power: "5 kW", modelCode: "HYB-05KLSG-01-TVN", maxPvInput: "10 kW", batteryCurrent: "112 A", batteryPower: "5.4 kW" }),
    ecoLinkProduct({ slug: "ecolink-6-kw", power: "6 kW", modelCode: "HYB-06KLSG-01-TVN", maxPvInput: "12 kW", batteryCurrent: "130 A", batteryPower: "6.5 kW" }),
    ecoLinkProduct({ slug: "ecolink-8-kw", power: "8 kW", modelCode: "HYB-08KLSG-01-TVN", maxPvInput: "12 kW", batteryCurrent: "180 A", batteryPower: "8.8 kW" }),

    offGridProduct("6-2-kw-ip54", "6.2 kW", "/uploads/downloads/slh-ofg-6kw-off-grid-inverter-datasheet.pdf"),
    offGridProduct("8-2-kw-ip54", "8.2 kW", "/uploads/downloads/slh-ofg-8-2kw-10-2kw-solar-inverter-datasheet.pdf"),

    allInOneProduct({ slug: "500w-1kwh", output: "500 W", storage: "1 kWh", image: `${imageRoot}/aio-500w-1kwh-cutout.png`, family: "mini", model: "IYP-1K1A-500F1-A1", voltage: "3.2 V", capacity: "314 Ah", pvPower: "300 W", mppt: "11–55 V", pvCurrent: "10 A", size: "310 × 360 × 151 mm", weight: "15 kg", datasheetUrl: "/uploads/downloads/aio-500w-1kw-dual-mount-energy-storage-datasheet.pdf" }),
    allInOneProduct({ slug: "1kw-2kwh", output: "1 kW", storage: "2 kWh", image: `${imageRoot}/aio-1kw-2kwh-cutout.png`, family: "mini", model: "IYP-2K1A-1KF1-A1", voltage: "6.4 V", capacity: "314 Ah", pvPower: "500 W", mppt: "12–60 V", pvCurrent: "15 A", size: "350 × 270 × 241 mm", weight: "20 kg", datasheetUrl: "/uploads/downloads/aio-500w-1kw-dual-mount-energy-storage-datasheet.pdf" }),
    allInOneProduct({ slug: "2kw-2-6kwh", output: "2 kW", storage: "2.6 kWh", image: `${imageRoot}/aio-2kw-2-6kwh-cutout.png`, family: "standing", model: "IYP-ST2K6A-2KF1-A1", voltage: "12.8 V", capacity: "206 Ah", pvPower: "3 kW", mppt: "30–400 Vdc", pvCurrent: "18 A", transfer: "20 ms", size: "610 × 390 × 230 mm", weight: "20 kg", datasheetUrl: "/uploads/downloads/aio-2kw-2-6kwh-4kwh-standing-all-in-one-ess-datasheet.pdf" }),
    allInOneProduct({ slug: "2kw-4kwh", output: "2 kW", storage: "4 kWh", image: `${imageRoot}/aio-2kw-4kwh-cutout.png`, family: "standing", model: "IYP-ST4K1A-2KF1-A1", voltage: "12.8 V", capacity: "314 Ah", pvPower: "3 kW", mppt: "30–400 Vdc", pvCurrent: "18 A", transfer: "20 ms", size: "610 × 390 × 230 mm", weight: "30 kg", datasheetUrl: "/uploads/downloads/aio-2kw-2-6kwh-4kwh-standing-all-in-one-ess-datasheet.pdf" }),
    allInOneProduct({ slug: "6kw-10-5kwh", output: "6 kW", storage: "10.5 kWh", image: `${imageRoot}/aio-6kw-10-5kwh-cutout.png`, family: "standing", model: "IYP-ST10K5A-6KF1-A1", voltage: "51.2 V", capacity: "206 Ah", pvPower: "8.5 kW", mppt: "60–450 Vdc", pvCurrent: "22.5 A", transfer: "20 ms", size: "485 × 270 × 760 mm", weight: "85 kg" }),
    allInOneProduct({ slug: "10kw-10-5kwh", output: "10 kW", storage: "10.5 kWh", image: `${imageRoot}/aio-10kw-10-5kwh-cutout.png`, family: "standing", model: "IYP-ST10K5A-10KF1-A1", voltage: "51.2 V", capacity: "206 Ah", pvPower: "15 kW", mppt: "60–450 Vdc", pvCurrent: "25 A", transfer: "20 ms", size: "513 × 305 × 820 mm", weight: "97 kg" }),
    allInOneProduct({ slug: "6kw-16kwh", output: "6 kW", storage: "16 kWh", image: `${imageRoot}/aio-6kw-16kwh-cutout.png`, family: "standing", model: "IYP-ST16K1A-6KF1-A1", voltage: "51.2 V", capacity: "314 Ah", pvPower: "8.5 kW", mppt: "60–450 Vdc", pvCurrent: "22.5 A", transfer: "20 ms", size: "510 × 375 × 770 mm", weight: "124 kg", datasheetUrl: "/uploads/downloads/aio-6kw-12kw-16kwh-standing-all-in-one-ess-datasheet.pdf" }),
    allInOneProduct({ slug: "12kw-16kwh", output: "12 kW", storage: "16 kWh", image: `${imageRoot}/aio-12kw-16kwh-cutout.png`, family: "standing", model: "IYP-ST16K1A-12KF1-A1", voltage: "51.2 V", capacity: "314 Ah", pvPower: "15 kW", mppt: "60–450 Vdc", pvCurrent: "25 A", transfer: "20 ms", size: "510 × 377 × 770 mm", weight: "130 kg", datasheetUrl: "/uploads/downloads/aio-6kw-12kw-16kwh-standing-all-in-one-ess-datasheet.pdf" }),
  ];

  const href = (category, slug) => `/products/${category}/${slug}`;

  window.TERVONA_PRODUCT_CATALOG = {
    language: "en",
    taxonomy: [
      {
        slug: "battery-pack",
        label: "Battery Packs",
        code: "BP",
        href: "/products/low-voltage-battery",
        aliases: ["low-voltage-battery"],
        children: [
          {
            label: "Low Voltage",
            priority: true,
            children: [
              { label: "5 kWh Rack-Mount", href: href("low-voltage-battery", "5-kwh-rack-mount") },
              { label: "7.5 kWh Rack-Mount", href: href("low-voltage-battery", "7-5-kw-rack-mount") },
              { label: "10 kWh Floor-Standing", href: href("low-voltage-battery", "10-kwh-floor-standing") },
              { label: "16 kWh Floor-Standing", href: href("low-voltage-battery", "16-kwh-floor-standing") },
              { label: "32 kWh Floor-Standing", href: href("low-voltage-battery", "32-kwh-floor-standing") },
            ],
          },
          { label: "High Voltage", children: [{ label: "8 kWh Stackable" }, { label: "9 kWh Stackable" }] },
        ],
      },
      {
        slug: "hybrid-inverter",
        label: "Hybrid Inverters",
        code: "HI",
        href: "/products/hybrid-inverter",
        children: [
          {
            label: "High Voltage",
            children: [
              { label: "Single Phase", children: [{ label: "6 kW" }, { label: "8 kW" }, { label: "10 kW" }] },
              { label: "Three Phase", children: [{ label: "10 kW" }, { label: "12 kW" }, { label: "15 kW" }, { label: "20 kW" }] },
            ],
          },
          {
            label: "Low Voltage",
            children: [
              { label: "Three Phase", children: [{ label: "12 kW" }, { label: "10 kW" }] },
              {
                label: "Single Phase",
                children: [
                  {
                    label: "EcoLink Series",
                    priority: true,
                    children: [
                      { label: "3.6 kW", href: href("hybrid-inverter", "ecolink-3-6-kw") },
                      { label: "4.6 kW", href: href("hybrid-inverter", "ecolink-4-6-kw") },
                      { label: "5 kW", href: href("hybrid-inverter", "ecolink-5-kw") },
                      { label: "6 kW", href: href("hybrid-inverter", "ecolink-6-kw") },
                      { label: "8 kW", href: href("hybrid-inverter", "ecolink-8-kw") },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "off-grid-inverter",
        label: "Off-Grid Inverters",
        code: "OG",
        href: "/products/off-grid-inverter",
        children: [
          {
            label: "Single Phase",
            priority: true,
            children: [
              { label: "6.2 kW · IP54", href: href("off-grid-inverter", "6-2-kw-ip54") },
              { label: "8.2 kW · IP54", href: href("off-grid-inverter", "8-2-kw-ip54") },
            ],
          },
          { label: "Three Phase", children: [{ label: "10.2 kW" }, { label: "11.2 kW" }] },
        ],
      },
      {
        slug: "all-in-one-ess",
        label: "All-in-One Energy Storage",
        code: "ESS",
        href: "/products/all-in-one-ess",
        children: [
          { label: "500 W / 1 kWh", href: href("all-in-one-ess", "500w-1kwh") },
          { label: "1 kW / 2 kWh", href: href("all-in-one-ess", "1kw-2kwh") },
          { label: "2 kW / 2.6 kWh", href: href("all-in-one-ess", "2kw-2-6kwh") },
          { label: "2 kW / 4 kWh", href: href("all-in-one-ess", "2kw-4kwh") },
          { label: "6 kW / 10.5 kWh", href: href("all-in-one-ess", "6kw-10-5kwh"), priority: true },
          { label: "10 kW / 10.5 kWh", href: href("all-in-one-ess", "10kw-10-5kwh"), priority: true },
          { label: "6 kW / 16 kWh", href: href("all-in-one-ess", "6kw-16kwh") },
          { label: "12 kW / 16 kWh", href: href("all-in-one-ess", "12kw-16kwh") },
        ],
      },
      { slug: "ev-charger", label: "EV Chargers", code: "EV", children: [] },
      { slug: "cloud", label: "Cloud", code: "CL", children: [] },
    ],
    categories: [
      {
        slug: "low-voltage-battery",
        title: "Low-Voltage Batteries",
        navTitle: "Low-Voltage Batteries",
        intro: "Five low-voltage battery products in rack-mount and floor-standing formats.",
        heroImage: lowVoltageBatteryImage,
        bannerBackground: categoryScene,
        icon: lowVoltageBatteryImage,
        status: "Published",
      },
      {
        slug: "hybrid-inverter",
        title: "Low-Voltage Hybrid Inverters",
        navTitle: "Low-Voltage Hybrid Inverters",
        intro: "Five EcoLink single-phase low-voltage hybrid inverter models from 3.6 kW to 8 kW.",
        heroImage: ecoLinkImage,
        bannerBackground: categoryScene,
        icon: ecoLinkImage,
        status: "Published",
      },
      {
        slug: "off-grid-inverter",
        title: "Single-Phase Off-Grid Inverters",
        navTitle: "Single-Phase Off-Grid Inverters",
        intro: "Two single-phase IP54 off-grid inverter products in 6.2 kW and 8.2 kW power classes.",
        heroImage: offGridImage,
        bannerBackground: categoryScene,
        icon: offGridImage,
        status: "Published",
      },
      {
        slug: "all-in-one-ess",
        title: "All-in-One Energy Storage",
        navTitle: "All-in-One Energy Storage",
        intro: "Eight all-in-one energy storage configurations from 500 W / 1 kWh to 12 kW / 16 kWh.",
        heroImage: allInOneImage,
        bannerBackground: categoryScene,
        icon: allInOneImage,
        status: "Published",
      },
    ],
    products,
  };
})();
