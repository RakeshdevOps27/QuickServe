package com.quickserve.config;

import com.quickserve.entity.*;
import com.quickserve.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Upgrade database column type if constraint exists
        try {
            jdbcTemplate.execute("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50)");
            System.out.println("Schema Migration: successfully altered bookings.status to VARCHAR(50).");
        } catch (Exception e) {
            System.out.println("Schema Migration Info: bookings.status is already upgraded or ALTER failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE payments MODIFY COLUMN payment_status VARCHAR(50)");
            System.out.println("Schema Migration: successfully altered payments.payment_status to VARCHAR(50).");
        } catch (Exception e) {}
        try {
            jdbcTemplate.execute("UPDATE payments SET payment_status = 'PAID' WHERE payment_status = 'COMPLETED'");
            System.out.println("Schema Migration: successfully migrated payments COMPLETED to PAID.");
        } catch (Exception e) {}
        try {
            jdbcTemplate.execute("ALTER TABLE complaints MODIFY COLUMN status VARCHAR(50)");
            System.out.println("Schema Migration: successfully altered complaints.status to VARCHAR(50).");
        } catch (Exception e) {}
        try {
            jdbcTemplate.execute("ALTER TABLE addresses ADD COLUMN active BIT(1) NOT NULL DEFAULT 1");
            System.out.println("Schema Migration: successfully added active column to addresses.");
        } catch (Exception e) {
            try {
                jdbcTemplate.execute("UPDATE addresses SET active = 1 WHERE active IS NULL");
            } catch (Exception ex) {}
        }
        try {
            jdbcTemplate.execute("ALTER TABLE professional_profiles ADD COLUMN id_type VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE professional_profiles ADD COLUMN id_number VARCHAR(255)");
            System.out.println("Schema Migration: successfully added id_type and id_number to professional_profiles.");
        } catch (Exception e) {}

        // 1. Initialize Time Slots
        if (timeSlotRepository.count() == 0) {
            List<TimeSlot> slots = Arrays.asList(
                    TimeSlot.builder().startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(11, 0)).build(),
                    TimeSlot.builder().startTime(LocalTime.of(11, 0)).endTime(LocalTime.of(13, 0)).build(),
                    TimeSlot.builder().startTime(LocalTime.of(13, 0)).endTime(LocalTime.of(15, 0)).build(),
                    TimeSlot.builder().startTime(LocalTime.of(15, 0)).endTime(LocalTime.of(17, 0)).build(),
                    TimeSlot.builder().startTime(LocalTime.of(17, 0)).endTime(LocalTime.of(19, 0)).build()
            );
            timeSlotRepository.saveAll(slots);
            System.out.println("Default time slots initialized.");
        }

        // 2. Initialize Admin User
        if (userRepository.findByEmail("admin@quickserve.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@quickserve.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Admin")
                    .phoneNumber("1234567890")
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Default Admin user initialized (admin@quickserve.com / admin123).");
        }

        // 3. Initialize Customer User
        User customer = null;
        if (userRepository.findByEmail("customer@quickserve.com").isEmpty()) {
            customer = User.builder()
                    .email("customer@quickserve.com")
                    .password(passwordEncoder.encode("customer123"))
                    .fullName("Alice Customer")
                    .phoneNumber("9876543210")
                    .role(Role.CUSTOMER)
                    .enabled(true)
                    .build();
            customer = userRepository.save(customer);
            System.out.println("Default Customer user initialized.");
        } else {
            customer = userRepository.findByEmail("customer@quickserve.com").get();
        }

        // 4. Initialize Customer Address
        Address address = null;
        if (addressRepository.findByUserId(customer.getId()).isEmpty()) {
            address = Address.builder()
                    .user(customer)
                    .streetAddress("123 Broadway St")
                    .city("New York")
                    .state("NY")
                    .zipCode("10001")
                    .landmark("Near Times Square")
                    .isDefault(true)
                    .build();
            address = addressRepository.save(address);
            System.out.println("Default Address initialized.");
        } else {
            address = addressRepository.findByUserId(customer.getId()).get(0);
        }

        // 5. Initialize Professional User & Profile
        User professional = null;
        if (userRepository.findByEmail("professional@quickserve.com").isEmpty()) {
            professional = User.builder()
                    .email("professional@quickserve.com")
                    .password(passwordEncoder.encode("professional123"))
                    .fullName("Bob Professional")
                    .phoneNumber("5551234567")
                    .role(Role.PROFESSIONAL)
                    .enabled(true)
                    .build();
            professional = userRepository.save(professional);

            ProfessionalProfile profile = ProfessionalProfile.builder()
                    .user(professional)
                    .specialization(Specialization.PLUMBING)
                    .experienceYears(8)
                    .bio("Certified Master Plumber with over 8 years of experience. Expert in pipeline leakages, clog removal, and drain cleaning services.")
                    .city("New York")
                    .serviceArea("Manhattan")
                    .verificationStatus(VerificationStatus.VERIFIED)
                    .availabilityStatus(AvailabilityStatus.AVAILABLE)
                    .rating(5.0)
                    .totalRatings(1)
                    .idType("Aadhaar Card")
                    .idNumber("1234-5678-9012")
                    .build();
            professionalProfileRepository.save(profile);
            System.out.println("Default Professional user & profile initialized.");
        } else {
            professional = userRepository.findByEmail("professional@quickserve.com").get();
        }

        // 6. Initialize Categories and Services

        // -- Category 1: Plumbing (Preserved)
        Category plumbingCat = null;
        if (categoryRepository.findByName("Plumbing").isEmpty()) {
            plumbingCat = Category.builder()
                    .name("Plumbing")
                    .description("Fix leaks, pipeline blockages, taps, toilet flushing, and sink assemblies.")
                    .build();
            plumbingCat = categoryRepository.save(plumbingCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(plumbingCat).name("Leaky Pipe Repair")
                    .description("Professional diagnostics and fixing of leaking pipes behind walls or sinks.")
                    .price(BigDecimal.valueOf(499.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(plumbingCat).name("Drain Blockage Removal")
                    .description("Complete clearing of blockages in drains, kitchen sinks, or toilets.")
                    .price(BigDecimal.valueOf(799.00)).durationMinutes(90).build());
        } else {
            plumbingCat = categoryRepository.findByName("Plumbing").get();
        }

        // -- Category 2: Electrical Repair (Preserved)
        Category electricalCat = null;
        if (categoryRepository.findByName("Electrical Repair").isEmpty()) {
            electricalCat = Category.builder()
                    .name("Electrical Repair")
                    .description("Short circuit fixes, switches, fans, light fixtures, and breaker box updates.")
                    .build();
            electricalCat = categoryRepository.save(electricalCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(electricalCat).name("Ceiling Fan Installation")
                    .description("Safe assembly, wiring, and balancing mount installation of a new ceiling fan.")
                    .price(BigDecimal.valueOf(399.00)).durationMinutes(45).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(electricalCat).name("Short Circuit Diagnosis")
                    .description("Detection and fixing of tripping circuit breakers, short circuits, or wiring faults.")
                    .price(BigDecimal.valueOf(999.00)).durationMinutes(120).build());
        }

        // -- Category 3: AC & Appliance Services (NEW)
        Category acApplianceCat = null;
        if (categoryRepository.findByName("AC & Appliance Services").isEmpty()) {
            acApplianceCat = Category.builder()
                    .name("AC & Appliance Services")
                    .description("AC Wet cleaning, repair and installation along with key home appliances repair.")
                    .build();
            acApplianceCat = categoryRepository.save(acApplianceCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(acApplianceCat).name("AC Service")
                    .description("AC filter cleaning, cooling check-up, and outdoor unit servicing.")
                    .price(BigDecimal.valueOf(599.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(acApplianceCat).name("AC Repair")
                    .description("Fixing cooling issues, replacement of capacitors, or resolving abnormal noises.")
                    .price(BigDecimal.valueOf(999.00)).durationMinutes(90).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(acApplianceCat).name("AC Installation")
                    .description("Mounting and complete installation setup for Split/Window AC units.")
                    .price(BigDecimal.valueOf(1499.00)).durationMinutes(120).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(acApplianceCat).name("Refrigerator Repair")
                    .description("Fixing cooling issues, compressor diagnostics, and door seal replacement.")
                    .price(BigDecimal.valueOf(799.00)).durationMinutes(90).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(acApplianceCat).name("Washing Machine Repair")
                    .description("Fixing drum issues, spin cycles, water drainage pipes, or motor faults.")
                    .price(BigDecimal.valueOf(899.00)).durationMinutes(90).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(acApplianceCat).name("Microwave Repair")
                    .description("Fixing heating magnetron, touch panels, turntable motors, or internal sparks.")
                    .price(BigDecimal.valueOf(499.00)).durationMinutes(60).build());
        }

        // -- Category 4: Home Cleaning (NEW)
        Category cleaningCat = null;
        if (categoryRepository.findByName("Home Cleaning").isEmpty()) {
            cleaningCat = Category.builder()
                    .name("Home Cleaning")
                    .description("Eco-friendly deep cleaning, bathroom scrubbing, and sofa sanitization.")
                    .build();
            cleaningCat = categoryRepository.save(cleaningCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(cleaningCat).name("Full Home Cleaning")
                    .description("Complete sweeping, mopping, dusting, vacuuming, and kitchen cleaning.")
                    .price(BigDecimal.valueOf(2999.00)).durationMinutes(240).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(cleaningCat).name("Bathroom Cleaning")
                    .description("Deep scrubbing of tiles, showers, sinks, toilet bowl sanitizing, and floor cleaning.")
                    .price(BigDecimal.valueOf(399.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(cleaningCat).name("Kitchen Cleaning")
                    .description("Chimney degreasing, cabinets deep wiping, tile stains removal, and floor wash.")
                    .price(BigDecimal.valueOf(1199.00)).durationMinutes(120).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(cleaningCat).name("Sofa Cleaning")
                    .description("Upholstery vacuuming, wet-wash shampooing, and drying for a standard 3-seater sofa.")
                    .price(BigDecimal.valueOf(499.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(cleaningCat).name("Carpet Cleaning")
                    .description("Removing stains, odors, deep dirt, and shampooing carpets.")
                    .price(BigDecimal.valueOf(699.00)).durationMinutes(90).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(cleaningCat).name("Deep Cleaning")
                    .description("Intensive dusting of window panels, balcony cleaning, floor scrub machine, and bathroom sanitizing.")
                    .price(BigDecimal.valueOf(3499.00)).durationMinutes(300).build());
        }

        // -- Category 5: Carpentry Services (NEW)
        Category carpentryCat = null;
        if (categoryRepository.findByName("Carpentry Services").isEmpty()) {
            carpentryCat = Category.builder()
                    .name("Carpentry Services")
                    .description("Furniture restoration, hinge alignment, structural repairs, and custom drilling.")
                    .build();
            carpentryCat = categoryRepository.save(carpentryCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(carpentryCat).name("Furniture Repair")
                    .description("Fixing wobbly tables, chairs, drawer channels, or cabinet door hinges.")
                    .price(BigDecimal.valueOf(299.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(carpentryCat).name("Door Repair")
                    .description("Aligning doors, fixing latches, lock replacements, or hinge greasing.")
                    .price(BigDecimal.valueOf(349.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(carpentryCat).name("Drilling")
                    .description("Drilling holes for wall mounting paintings, shelves, clocks, or curtains (up to 5 holes).")
                    .price(BigDecimal.valueOf(149.00)).durationMinutes(30).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(carpentryCat).name("Furniture Assembly")
                    .description("Complete assembly of flat-packed wardrobes, beds, TV units, or computer tables.")
                    .price(BigDecimal.valueOf(799.00)).durationMinutes(120).build());
        }

        // -- Category 6: Painting Services (NEW)
        Category paintingCat = null;
        if (categoryRepository.findByName("Painting Services").isEmpty()) {
            paintingCat = Category.builder()
                    .name("Painting Services")
                    .description("Interior/exterior room painting, accent wall coatings, and premium waterproofing.")
                    .build();
            paintingCat = categoryRepository.save(paintingCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(paintingCat).name("Room Painting")
                    .description("Wall sanding, putty base, and two coats of premium emulsion paint for one standard room.")
                    .price(BigDecimal.valueOf(4999.00)).durationMinutes(360).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(paintingCat).name("Wall Painting")
                    .description("Single accent/designer wall painting with modern color schemes.")
                    .price(BigDecimal.valueOf(2499.00)).durationMinutes(240).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(paintingCat).name("Waterproofing")
                    .description("Wall seepage treatment, damproofing primer coating, and protective acrylic layers.")
                    .price(BigDecimal.valueOf(8999.00)).durationMinutes(480).build());
        }

        // -- Category 7: Pest Control (NEW)
        Category pestCat = null;
        if (categoryRepository.findByName("Pest Control").isEmpty()) {
            pestCat = Category.builder()
                    .name("Pest Control")
                    .description("Cockroach gels, termite chemical mapping, and odorless mosquito fogging.")
                    .build();
            pestCat = categoryRepository.save(pestCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(pestCat).name("Cockroach Control")
                    .description("Gel bait application in kitchen cabinet corners and spray in water outlets (1-BHK/2-BHK).")
                    .price(BigDecimal.valueOf(699.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(pestCat).name("Termite Control")
                    .description("Drilling chemical barriers inside wooden closets and wall base corners.")
                    .price(BigDecimal.valueOf(1499.00)).durationMinutes(120).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(pestCat).name("Mosquito Control")
                    .description("Fogging treatment on balconies, indoor corners, and breeding spots.")
                    .price(BigDecimal.valueOf(899.00)).durationMinutes(90).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(pestCat).name("Bed Bug Control")
                    .description("Two-session chemical spray targeting mattress folds and bed frame corners.")
                    .price(BigDecimal.valueOf(1199.00)).durationMinutes(90).build());
        }

        // -- Category 8: Beauty & Salon at Home (NEW)
        Category beautyCat = null;
        if (categoryRepository.findByName("Beauty & Salon at Home").isEmpty()) {
            beautyCat = Category.builder()
                    .name("Beauty & Salon at Home")
                    .description("Professional haircuts, organic facials, manicures, and complete styling at home.")
                    .build();
            beautyCat = categoryRepository.save(beautyCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(beautyCat).name("Haircut")
                    .description("Professional haircut and styling with blow dry.")
                    .price(BigDecimal.valueOf(249.00)).durationMinutes(30).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(beautyCat).name("Facial")
                    .description("Cleansing, exfoliating, massage, and pack using organic fruit extracts.")
                    .price(BigDecimal.valueOf(999.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(beautyCat).name("Manicure & Pedicure")
                    .description("Complete hand and foot nail shaping, scrubbing, massage, and nail polish.")
                    .price(BigDecimal.valueOf(699.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(beautyCat).name("Hair Styling")
                    .description("Ironing, curling, or blow dry styling for special events.")
                    .price(BigDecimal.valueOf(499.00)).durationMinutes(45).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(beautyCat).name("Grooming")
                    .description("Standard beard trim, shaving, massage, and charcoal face mask.")
                    .price(BigDecimal.valueOf(799.00)).durationMinutes(60).build());
        }

        // -- Category 9: TV & Electronics Installation (NEW)
        Category electronicsCat = null;
        if (categoryRepository.findByName("TV & Electronics Installation").isEmpty()) {
            electronicsCat = Category.builder()
                    .name("TV & Electronics Installation")
                    .description("TV wall mounting, DTH receiver updates, and home theater configuration.")
                    .build();
            electronicsCat = categoryRepository.save(electronicsCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(electronicsCat).name("TV Wall Mounting")
                    .description("Mounting LED/LCD television bracket on masonry wall, cable hiding, and setup.")
                    .price(BigDecimal.valueOf(349.00)).durationMinutes(45).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(electronicsCat).name("DTH Installation")
                    .description("Dish antenna mounting, signal configuration, and receiver connection setup.")
                    .price(BigDecimal.valueOf(299.00)).durationMinutes(45).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(electronicsCat).name("Speaker/Home-Theatre Installation")
                    .description("Speaker assembly placement, wiring routing, and receiver configuration setup.")
                    .price(BigDecimal.valueOf(999.00)).durationMinutes(120).build());
        }

        // -- Category 10: CCTV & Smart Home Services (NEW)
        Category smartHomeCat = null;
        if (categoryRepository.findByName("CCTV & Smart Home Services").isEmpty()) {
            smartHomeCat = Category.builder()
                    .name("CCTV & Smart Home Services")
                    .description("CCTV security camera mounts, smart biometric lock setups, and router configuration.")
                    .build();
            smartHomeCat = categoryRepository.save(smartHomeCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(smartHomeCat).name("CCTV Installation")
                    .description("Mounting CCTV camera, connecting power adapters, mapping DVR, and mobile view app configuration.")
                    .price(BigDecimal.valueOf(1999.00)).durationMinutes(180).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(smartHomeCat).name("Smart Lock Installation")
                    .description("Installing smart digital/biometric lock on wooden doors, calibration, and app sync.")
                    .price(BigDecimal.valueOf(1199.00)).durationMinutes(90).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(smartHomeCat).name("Wi-Fi/Router Setup")
                    .description("Router installation, SSID naming, Wi-Fi password configuration, and network range checks.")
                    .price(BigDecimal.valueOf(299.00)).durationMinutes(30).build());
        }

        // -- Category 11: Water Purifier Services (NEW)
        Category roCat = null;
        if (categoryRepository.findByName("Water Purifier Services").isEmpty()) {
            roCat = Category.builder()
                    .name("Water Purifier Services")
                    .description("RO filter cleaning, sediment replacement, and smart water TDS tests.")
                    .build();
            roCat = categoryRepository.save(roCat);

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(roCat).name("RO Service")
                    .description("Filter cleaning, pipeline leakage check, and TDS levels testing.")
                    .price(BigDecimal.valueOf(499.00)).durationMinutes(60).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(roCat).name("Filter Replacement")
                    .description("Replacing activated carbon and sediment filter components (parts charges extra).")
                    .price(BigDecimal.valueOf(999.00)).durationMinutes(45).build());

            serviceRepository.save(com.quickserve.entity.Service.builder()
                    .category(roCat).name("RO Installation")
                    .description("Drilling wall mount and plumbing inlet/outlet configuration setup for RO purifier.")
                    .price(BigDecimal.valueOf(1199.00)).durationMinutes(90).build());
        }

        // 7. Seed Sample Bookings, Payments, and Reviews
        if (bookingRepository.count() == 0) {
            List<TimeSlot> slots = timeSlotRepository.findAll();
            List<com.quickserve.entity.Service> plumbingServices = serviceRepository.findByCategoryId(plumbingCat.getId());
            com.quickserve.entity.Service serviceToBook = plumbingServices.get(0); // Leaky Pipe Repair

            // Seed a completed booking (2 days ago) in INR
            BigDecimal compBase = serviceToBook.getPrice();
            BigDecimal compVisit = new BigDecimal("100.00");
            BigDecimal compTax = compBase.add(compVisit).multiply(new BigDecimal("0.18")).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal compFinal = compBase.add(compVisit).add(compTax).setScale(2, java.math.RoundingMode.HALF_UP);

            Booking compBooking = Booking.builder()
                    .customer(customer)
                    .professional(professional)
                    .service(serviceToBook)
                    .address(address)
                    .bookingDate(LocalDate.now().minusDays(2))
                    .timeSlot(slots.get(0))
                    .status(BookingStatus.COMPLETED)
                    .price(compFinal)
                    .notes("Previous sink leakage fix")
                    .currency("INR")
                    .exchangeRate(BigDecimal.ONE)
                    .basePrice(compBase)
                    .visitCharge(compVisit)
                    .materialCharges(BigDecimal.ZERO)
                    .tax(compTax)
                    .finalAmount(compFinal)
                    .build();
            compBooking = bookingRepository.save(compBooking);

            // Add completed Payment
            Payment payment = Payment.builder()
                    .booking(compBooking)
                    .amount(compBooking.getPrice())
                    .paymentMethod(PaymentMethod.CARD)
                    .paymentStatus(PaymentStatus.PAID)
                    .transactionId("TXN-SEED123")
                    .currency("INR")
                    .exchangeRate(BigDecimal.ONE)
                    .build();
            paymentRepository.save(payment);

            // Add Review
            Review review = Review.builder()
                    .booking(compBooking)
                    .customer(customer)
                    .professional(professional)
                    .service(serviceToBook)
                    .rating(5)
                    .comment("Fantastic plumber! Arrived on time and resolved the leakage in under an hour. Strongly recommended!")
                    .build();
            reviewRepository.save(review);

            // Seed an active booking (In Progress today) in USD
            BigDecimal activeBase = serviceToBook.getPrice();
            BigDecimal activeVisit = new BigDecimal("5.00"); // USD flat visit
            BigDecimal activeTax = activeBase.add(activeVisit).multiply(new BigDecimal("0.18")).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal activeFinal = activeBase.add(activeVisit).add(activeTax).setScale(2, java.math.RoundingMode.HALF_UP);

            Booking activeBooking = Booking.builder()
                    .customer(customer)
                    .professional(professional)
                    .service(serviceToBook)
                    .address(address)
                    .bookingDate(LocalDate.now())
                    .timeSlot(slots.get(2))
                    .status(BookingStatus.IN_PROGRESS)
                    .price(activeFinal)
                    .notes("Main supply line check")
                    .currency("USD")
                    .exchangeRate(BigDecimal.valueOf(0.012))
                    .basePrice(activeBase)
                    .visitCharge(activeVisit)
                    .materialCharges(BigDecimal.ZERO)
                    .tax(activeTax)
                    .finalAmount(activeFinal)
                    .build();
            bookingRepository.save(activeBooking);

            System.out.println("Sample completed and active booking data seeded.");
        }
    }
}
