-- ============================================================
-- Create the Review_team4 table and seed it with dummy reviews
-- ============================================================

-- Create table if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM sys.tables WHERE name = 'Review_team4' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
  CREATE TABLE dbo.Review_team4 (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    OrganisationId  INT           NOT NULL,
    ReviewerName    NVARCHAR(100) NOT NULL,
    Rating          INT           NOT NULL,
    Title           NVARCHAR(200) NOT NULL,
    ReviewText      NVARCHAR(MAX) NOT NULL,
    CreatedAt       DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
END;
GO

-- ============================================================
-- Seed dummy reviews (only if the table is empty)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Review_team4)
BEGIN
  -- Get some real Organisation IDs from the existing table
  -- We'll insert reviews for the first 6 organisations found
  DECLARE @org1 INT, @org2 INT, @org3 INT, @org4 INT, @org5 INT, @org6 INT;

  SELECT TOP 6
    @org1 = MIN(Id),
    @org2 = MIN(CASE WHEN rn = 2 THEN Id END),
    @org3 = MIN(CASE WHEN rn = 3 THEN Id END),
    @org4 = MIN(CASE WHEN rn = 4 THEN Id END),
    @org5 = MIN(CASE WHEN rn = 5 THEN Id END),
    @org6 = MIN(CASE WHEN rn = 6 THEN Id END)
  FROM (
    SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn
    FROM dbo.Organisation_team4
  ) sub;

  -- Reviews for Organisation 1
  INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt) VALUES
  (@org1, 'Dafydd Williams',  5, 'Fantastic club atmosphere', 'Joined as a complete beginner last year and the welcome I received was unbelievable. The coaches are patient, the players are supportive, and every Saturday feels like a family gathering. Could not recommend more highly!', '2025-11-15 10:30:00'),
  (@org1, 'Sian Davies',      4, 'Great for kids too',        'My two sons have been playing at the minis section for three seasons now. The coaching is structured, safeguarding is taken seriously, and the kids absolutely love it. Only reason it is not 5 stars is the changing rooms could do with an update.', '2025-12-02 14:20:00'),
  (@org1, 'Tom Jenkins',      5, 'Proper Welsh rugby club',   'This is what grassroots rugby is all about. Good people, good rugby, and a proper clubhouse. Training is well organised and the social side is brilliant.', '2026-01-10 09:45:00');

  -- Reviews for Organisation 2
  INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt) VALUES
  (@org2, 'Rhian Morgan',     5, 'Welcoming and inclusive',    'As a woman returning to rugby after 10 years, I was nervous about joining. The club made me feel at home from day one. Mixed sessions are genuinely mixed — everyone gets involved.', '2025-10-22 18:15:00'),
  (@org2, 'Gareth Price',     4, 'Solid training sessions',    'Midweek training is well structured. Good mix of fitness, skills, and game play. Coaches know their stuff and always make time for individual feedback.', '2025-11-30 20:00:00'),
  (@org2, 'Emily Rees',       3, 'Good but parking is a pain', 'Love the club and the people, but getting parked on match days is a nightmare. The rugby itself is top quality and the atmosphere is always buzzing.', '2026-01-18 11:30:00');

  -- Reviews for Organisation 3
  INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt) VALUES
  (@org3, 'Owain Hughes',     5, 'Best decision I ever made',  'Moved to the area and joined the club to meet people. Three years later, some of my best mates are from the team. Rugby aside, the community aspect is second to none.', '2025-09-05 16:00:00'),
  (@org3, 'Catrin Lloyd',     4, 'Excellent youth setup',      'My daughter plays in the girls section and it is brilliantly run. The coaches focus on enjoyment first and skills development second — exactly the right way round for young players.', '2025-12-14 13:10:00');

  -- Reviews for Organisation 4
  INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt) VALUES
  (@org4, 'Ieuan Thomas',     4, 'Competitive but friendly',   'Good standard of rugby at senior level. Training is intense which I appreciate, but the lads are always up for a pint afterwards. Perfect balance of competition and camaraderie.', '2026-01-05 19:30:00'),
  (@org4, 'Hannah Jones',     5, 'Amazing community spirit',   'Volunteered at the annual fundraiser and was blown away by how many people turned up. This club is more than rugby — it is the heart of the community.', '2025-11-20 08:45:00'),
  (@org4, 'Mark Evans',       3, 'Decent but needs more coaches', 'The club has grown a lot recently which is great, but they need more qualified coaches to keep up with demand. Sessions can feel crowded at times.', '2026-01-25 17:00:00');

  -- Reviews for Organisation 5
  INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt) VALUES
  (@org5, 'Carys Griffiths',  5, 'Perfect for beginners',      'Never played rugby in my life before joining the touch rugby sessions here. Everyone is incredibly patient and encouraging. I actually look forward to Tuesday evenings now!', '2025-10-30 20:30:00'),
  (@org5, 'Rhodri ap Iorwerth', 4, 'Great facilities',         'Recently refurbished clubhouse and the pitch is always in good nick. The committee clearly puts a lot of effort into maintaining everything. Proud to be a member.', '2026-02-01 12:15:00');

  -- Reviews for Organisation 6
  INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt) VALUES
  (@org6, 'Lowri Bettws',     5, 'My home away from home',     'Been a member for over a decade. Through injuries, life changes, and everything in between — this club has always been there. The people make it special.', '2025-08-20 15:45:00'),
  (@org6, 'Dai Shepherd',     4, 'Strong vets section',        'The veterans section is thriving. Proper competitive fixtures but with a sensible approach to player welfare. Great way to keep playing into your 40s and beyond.', '2025-12-28 10:00:00'),
  (@org6, 'Ffion Harries',    5, 'Safeguarding is top notch',  'As a parent, safeguarding is my number one concern. This club takes it incredibly seriously — DBS checks, qualified first aiders at every session, clear policies. Peace of mind.', '2026-01-15 14:30:00');
END;
GO
