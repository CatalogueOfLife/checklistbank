const locales = {
    "en-US" : `<?xml version="1.0" encoding="utf-8"?>
    <locale xmlns="http://purl.org/net/xbiblio/csl" version="1.0" xml:lang="en-US">
      <info>
        <translator>
          <name>Andrew Dunning</name>
        </translator>
        <translator>
          <name>Sebastian Karcher</name>
        </translator>
        <translator>
          <name>Rintze M. Zelle</name>
        </translator>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
        <updated>2015-10-10T23:31:02+00:00</updated>
      </info>
      <style-options punctuation-in-quote="true"/>
      <date form="text">
        <date-part name="month" suffix=" "/>
        <date-part name="day" suffix=", "/>
        <date-part name="year"/>
      </date>
      <date form="numeric">
        <date-part name="month" form="numeric-leading-zeros" suffix="/"/>
        <date-part name="day" form="numeric-leading-zeros" suffix="/"/>
        <date-part name="year"/>
      </date>
      <terms>
        <term name="accessed">accessed</term>
        <term name="and">and</term>
        <term name="and others">and others</term>
        <term name="anonymous">anonymous</term>
        <term name="anonymous" form="short">anon.</term>
        <term name="at">at</term>
        <term name="available at">available at</term>
        <term name="by">by</term>
        <term name="circa">circa</term>
        <term name="circa" form="short">c.</term>
        <term name="cited">cited</term>
        <term name="edition">
          <single>edition</single>
          <multiple>editions</multiple>
        </term>
        <term name="edition" form="short">ed.</term>
        <term name="et-al">et al.</term>
        <term name="forthcoming">forthcoming</term>
        <term name="from">from</term>
        <term name="ibid">ibid.</term>
        <term name="in">in</term>
        <term name="in press">in press</term>
        <term name="internet">internet</term>
        <term name="interview">interview</term>
        <term name="letter">letter</term>
        <term name="no date">no date</term>
        <term name="no date" form="short">n.d.</term>
        <term name="online">online</term>
        <term name="presented at">presented at the</term>
        <term name="reference">
          <single>reference</single>
          <multiple>references</multiple>
        </term>
        <term name="reference" form="short">
          <single>ref.</single>
          <multiple>refs.</multiple>
        </term>
        <term name="retrieved">retrieved</term>
        <term name="scale">scale</term>
        <term name="version">version</term>
    
        <!-- ANNO DOMINI; BEFORE CHRIST -->
        <term name="ad">AD</term>
        <term name="bc">BC</term>
    
        <!-- PUNCTUATION -->
        <term name="open-quote">“</term>
        <term name="close-quote">”</term>
        <term name="open-inner-quote">‘</term>
        <term name="close-inner-quote">’</term>
        <term name="page-range-delimiter">–</term>
    
        <!-- ORDINALS -->
        <term name="ordinal">th</term>
        <term name="ordinal-01">st</term>
        <term name="ordinal-02">nd</term>
        <term name="ordinal-03">rd</term>
        <term name="ordinal-11">th</term>
        <term name="ordinal-12">th</term>
        <term name="ordinal-13">th</term>
    
        <!-- LONG ORDINALS -->
        <term name="long-ordinal-01">first</term>
        <term name="long-ordinal-02">second</term>
        <term name="long-ordinal-03">third</term>
        <term name="long-ordinal-04">fourth</term>
        <term name="long-ordinal-05">fifth</term>
        <term name="long-ordinal-06">sixth</term>
        <term name="long-ordinal-07">seventh</term>
        <term name="long-ordinal-08">eighth</term>
        <term name="long-ordinal-09">ninth</term>
        <term name="long-ordinal-10">tenth</term>
    
        <!-- LONG LOCATOR FORMS -->
        <term name="book">
          <single>book</single>
          <multiple>books</multiple>
        </term>
        <term name="chapter">
          <single>chapter</single>
          <multiple>chapters</multiple>
        </term>
        <term name="column">
          <single>column</single>
          <multiple>columns</multiple>
        </term>
        <term name="figure">
          <single>figure</single>
          <multiple>figures</multiple>
        </term>
        <term name="folio">
          <single>folio</single>
          <multiple>folios</multiple>
        </term>
        <term name="issue">
          <single>number</single>
          <multiple>numbers</multiple>
        </term>
        <term name="line">
          <single>line</single>
          <multiple>lines</multiple>
        </term>
        <term name="note">
          <single>note</single>
          <multiple>notes</multiple>
        </term>
        <term name="opus">
          <single>opus</single>
          <multiple>opera</multiple>
        </term>
        <term name="page">
          <single>page</single>
          <multiple>pages</multiple>
        </term>
        <term name="number-of-pages">
          <single>page</single>
          <multiple>pages</multiple>
        </term>
        <term name="paragraph">
          <single>paragraph</single>
          <multiple>paragraphs</multiple>
        </term>
        <term name="part">
          <single>part</single>
          <multiple>parts</multiple>
        </term>
        <term name="section">
          <single>section</single>
          <multiple>sections</multiple>
        </term>
        <term name="sub verbo">
          <single>sub verbo</single>
          <multiple>sub verbis</multiple>
        </term>
        <term name="verse">
          <single>verse</single>
          <multiple>verses</multiple>
        </term>
        <term name="volume">
          <single>volume</single>
          <multiple>volumes</multiple>
        </term>
    
        <!-- SHORT LOCATOR FORMS -->
        <term name="book" form="short">
          <single>bk.</single>
          <multiple>bks.</multiple>
        </term>
        <term name="chapter" form="short">
          <single>chap.</single>
          <multiple>chaps.</multiple>
        </term>
        <term name="column" form="short">
          <single>col.</single>
          <multiple>cols.</multiple>
        </term>
        <term name="figure" form="short">
          <single>fig.</single>
          <multiple>figs.</multiple>
        </term>
        <term name="folio" form="short">
          <single>fol.</single>
          <multiple>fols.</multiple>
        </term>
        <term name="issue" form="short">
          <single>no.</single>
          <multiple>nos.</multiple>
        </term>
        <term name="line" form="short">
          <single>l.</single>
          <multiple>ll.</multiple>
        </term>
        <term name="note" form="short">
          <single>n.</single>
          <multiple>nn.</multiple>
        </term>
        <term name="opus" form="short">
          <single>op.</single>
          <multiple>opp.</multiple>
        </term>
        <term name="page" form="short">
          <single>p.</single>
          <multiple>pp.</multiple>
        </term>
        <term name="number-of-pages" form="short">
          <single>p.</single>
          <multiple>pp.</multiple>
        </term>
        <term name="paragraph" form="short">
          <single>para.</single>
          <multiple>paras.</multiple>
        </term>
        <term name="part" form="short">
          <single>pt.</single>
          <multiple>pts.</multiple>
        </term>
        <term name="section" form="short">
          <single>sec.</single>
          <multiple>secs.</multiple>
        </term>
        <term name="sub verbo" form="short">
          <single>s.v.</single>
          <multiple>s.vv.</multiple>
        </term>
        <term name="verse" form="short">
          <single>v.</single>
          <multiple>vv.</multiple>
        </term>
        <term name="volume" form="short">
          <single>vol.</single>
          <multiple>vols.</multiple>
        </term>
    
        <!-- SYMBOL LOCATOR FORMS -->
        <term name="paragraph" form="symbol">
          <single>¶</single>
          <multiple>¶¶</multiple>
        </term>
        <term name="section" form="symbol">
          <single>§</single>
          <multiple>§§</multiple>
        </term>
    
        <!-- LONG ROLE FORMS -->
        <term name="director">
          <single>director</single>
          <multiple>directors</multiple>
        </term>
        <term name="editor">
          <single>editor</single>
          <multiple>editors</multiple>
        </term>
        <term name="editorial-director">
          <single>editor</single>
          <multiple>editors</multiple>
        </term>
        <term name="illustrator">
          <single>illustrator</single>
          <multiple>illustrators</multiple>
        </term>
        <term name="translator">
          <single>translator</single>
          <multiple>translators</multiple>
        </term>
        <term name="editortranslator">
          <single>editor &amp; translator</single>
          <multiple>editors &amp; translators</multiple>
        </term>
    
        <!-- SHORT ROLE FORMS -->
        <term name="director" form="short">
          <single>dir.</single>
          <multiple>dirs.</multiple>
        </term>
        <term name="editor" form="short">
          <single>ed.</single>
          <multiple>eds.</multiple>
        </term>
        <term name="editorial-director" form="short">
          <single>ed.</single>
          <multiple>eds.</multiple>
        </term>
        <term name="illustrator" form="short">
          <single>ill.</single>
          <multiple>ills.</multiple>
        </term>
        <term name="translator" form="short">
          <single>tran.</single>
          <multiple>trans.</multiple>
        </term>
        <term name="editortranslator" form="short">
          <single>ed. &amp; tran.</single>
          <multiple>eds. &amp; trans.</multiple>
        </term>
    
        <!-- VERB ROLE FORMS -->
        <term name="container-author" form="verb">by</term>
        <term name="director" form="verb">directed by</term>
        <term name="editor" form="verb">edited by</term>
        <term name="editorial-director" form="verb">edited by</term>
        <term name="illustrator" form="verb">illustrated by</term>
        <term name="interviewer" form="verb">interview by</term>
        <term name="recipient" form="verb">to</term>
        <term name="reviewed-author" form="verb">by</term>
        <term name="translator" form="verb">translated by</term>
        <term name="editortranslator" form="verb">edited &amp; translated by</term>
    
        <!-- SHORT VERB ROLE FORMS -->
        <term name="director" form="verb-short">dir. by</term>
        <term name="editor" form="verb-short">ed. by</term>
        <term name="editorial-director" form="verb-short">ed. by</term>
        <term name="illustrator" form="verb-short">illus. by</term>
        <term name="translator" form="verb-short">trans. by</term>
        <term name="editortranslator" form="verb-short">ed. &amp; trans. by</term>
    
        <!-- LONG MONTH FORMS -->
        <term name="month-01">January</term>
        <term name="month-02">February</term>
        <term name="month-03">March</term>
        <term name="month-04">April</term>
        <term name="month-05">May</term>
        <term name="month-06">June</term>
        <term name="month-07">July</term>
        <term name="month-08">August</term>
        <term name="month-09">September</term>
        <term name="month-10">October</term>
        <term name="month-11">November</term>
        <term name="month-12">December</term>
    
        <!-- SHORT MONTH FORMS -->
        <term name="month-01" form="short">Jan.</term>
        <term name="month-02" form="short">Feb.</term>
        <term name="month-03" form="short">Mar.</term>
        <term name="month-04" form="short">Apr.</term>
        <term name="month-05" form="short">May</term>
        <term name="month-06" form="short">Jun.</term>
        <term name="month-07" form="short">Jul.</term>
        <term name="month-08" form="short">Aug.</term>
        <term name="month-09" form="short">Sep.</term>
        <term name="month-10" form="short">Oct.</term>
        <term name="month-11" form="short">Nov.</term>
        <term name="month-12" form="short">Dec.</term>
    
        <!-- SEASONS -->
        <term name="season-01">Spring</term>
        <term name="season-02">Summer</term>
        <term name="season-03">Autumn</term>
        <term name="season-04">Winter</term>
      </terms>
    </locale>`,
    "en-GB" : `<?xml version="1.0" encoding="utf-8"?>
    <locale xmlns="http://purl.org/net/xbiblio/csl" version="1.0" xml:lang="en-GB">
      <info>
        <translator>
          <name>Andrew Dunning</name>
        </translator>
        <translator>
          <name>Sebastian Karcher</name>
        </translator>
        <translator>
          <name>Rintze M. Zelle</name>
        </translator>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
        <updated>2015-10-10T23:31:02+00:00</updated>
      </info>
      <style-options punctuation-in-quote="false"/>
      <date form="text">
        <date-part name="day" suffix=" "/>
        <date-part name="month" suffix=" "/>
        <date-part name="year"/>
      </date>
      <date form="numeric">
        <date-part name="day" form="numeric-leading-zeros" suffix="/"/>
        <date-part name="month" form="numeric-leading-zeros" suffix="/"/>
        <date-part name="year"/>
      </date>
      <terms>
        <term name="accessed">accessed</term>
        <term name="and">and</term>
        <term name="and others">and others</term>
        <term name="anonymous">anonymous</term>
        <term name="anonymous" form="short">anon.</term>
        <term name="at">at</term>
        <term name="available at">available at</term>
        <term name="by">by</term>
        <term name="circa">circa</term>
        <term name="circa" form="short">c.</term>
        <term name="cited">cited</term>
        <term name="edition">
          <single>edition</single>
          <multiple>editions</multiple>
        </term>
        <term name="edition" form="short">ed.</term>
        <term name="et-al">et al.</term>
        <term name="forthcoming">forthcoming</term>
        <term name="from">from</term>
        <term name="ibid">ibid.</term>
        <term name="in">in</term>
        <term name="in press">in press</term>
        <term name="internet">internet</term>
        <term name="interview">interview</term>
        <term name="letter">letter</term>
        <term name="no date">no date</term>
        <term name="no date" form="short">n.d.</term>
        <term name="online">online</term>
        <term name="presented at">presented at the</term>
        <term name="reference">
          <single>reference</single>
          <multiple>references</multiple>
        </term>
        <term name="reference" form="short">
          <single>ref.</single>
          <multiple>refs.</multiple>
        </term>
        <term name="retrieved">retrieved</term>
        <term name="scale">scale</term>
        <term name="version">version</term>
    
        <!-- ANNO DOMINI; BEFORE CHRIST -->
        <term name="ad">AD</term>
        <term name="bc">BC</term>
    
        <!-- PUNCTUATION -->
        <term name="open-quote">‘</term>
        <term name="close-quote">’</term>
        <term name="open-inner-quote">“</term>
        <term name="close-inner-quote">”</term>
        <term name="page-range-delimiter">–</term>
    
        <!-- ORDINALS -->
        <term name="ordinal">th</term>
        <term name="ordinal-01">st</term>
        <term name="ordinal-02">nd</term>
        <term name="ordinal-03">rd</term>
        <term name="ordinal-11">th</term>
        <term name="ordinal-12">th</term>
        <term name="ordinal-13">th</term>
    
        <!-- LONG ORDINALS -->
        <term name="long-ordinal-01">first</term>
        <term name="long-ordinal-02">second</term>
        <term name="long-ordinal-03">third</term>
        <term name="long-ordinal-04">fourth</term>
        <term name="long-ordinal-05">fifth</term>
        <term name="long-ordinal-06">sixth</term>
        <term name="long-ordinal-07">seventh</term>
        <term name="long-ordinal-08">eighth</term>
        <term name="long-ordinal-09">ninth</term>
        <term name="long-ordinal-10">tenth</term>
    
        <!-- LONG LOCATOR FORMS -->
        <term name="book">
          <single>book</single>
          <multiple>books</multiple>
        </term>
        <term name="chapter">
          <single>chapter</single>
          <multiple>chapters</multiple>
        </term>
        <term name="column">
          <single>column</single>
          <multiple>columns</multiple>
        </term>
        <term name="figure">
          <single>figure</single>
          <multiple>figures</multiple>
        </term>
        <term name="folio">
          <single>folio</single>
          <multiple>folios</multiple>
        </term>
        <term name="issue">
          <single>number</single>
          <multiple>numbers</multiple>
        </term>
        <term name="line">
          <single>line</single>
          <multiple>lines</multiple>
        </term>
        <term name="note">
          <single>note</single>
          <multiple>notes</multiple>
        </term>
        <term name="opus">
          <single>opus</single>
          <multiple>opera</multiple>
        </term>
        <term name="page">
          <single>page</single>
          <multiple>pages</multiple>
        </term>
        <term name="number-of-pages">
          <single>page</single>
          <multiple>pages</multiple>
        </term>
        <term name="paragraph">
          <single>paragraph</single>
          <multiple>paragraphs</multiple>
        </term>
        <term name="part">
          <single>part</single>
          <multiple>parts</multiple>
        </term>
        <term name="section">
          <single>section</single>
          <multiple>sections</multiple>
        </term>
        <term name="sub verbo">
          <single>sub verbo</single>
          <multiple>sub verbis</multiple>
        </term>
        <term name="verse">
          <single>verse</single>
          <multiple>verses</multiple>
        </term>
        <term name="volume">
          <single>volume</single>
          <multiple>volumes</multiple>
        </term>
    
        <!-- SHORT LOCATOR FORMS -->
        <term name="book" form="short">
          <single>bk.</single>
          <multiple>bks</multiple>
        </term>
        <term name="chapter" form="short">
          <single>chap.</single>
          <multiple>chaps</multiple>
        </term>
        <term name="column" form="short">
          <single>col.</single>
          <multiple>cols</multiple>
        </term>
        <term name="figure" form="short">
          <single>fig.</single>
          <multiple>figs</multiple>
        </term>
        <term name="folio" form="short">
          <single>fol.</single>
          <multiple>fols</multiple>
        </term>
        <term name="issue" form="short">
          <single>no.</single>
          <multiple>nos.</multiple>
        </term>
        <term name="line" form="short">
          <single>l.</single>
          <multiple>ll.</multiple>
        </term>
        <term name="note" form="short">
          <single>n.</single>
          <multiple>nn.</multiple>
        </term>
        <term name="opus" form="short">
          <single>op.</single>
          <multiple>opp.</multiple>
        </term>
        <term name="page" form="short">
          <single>p.</single>
          <multiple>pp.</multiple>
        </term>
        <term name="number-of-pages" form="short">
          <single>p.</single>
          <multiple>pp.</multiple>
        </term>
        <term name="paragraph" form="short">
          <single>para.</single>
          <multiple>paras</multiple>
        </term>
        <term name="part" form="short">
          <single>pt.</single>
          <multiple>pts</multiple>
        </term>
        <term name="section" form="short">
          <single>sec.</single>
          <multiple>secs</multiple>
        </term>
        <term name="sub verbo" form="short">
          <single>s.v.</single>
          <multiple>s.vv.</multiple>
        </term>
        <term name="verse" form="short">
          <single>v.</single>
          <multiple>vv.</multiple>
        </term>
        <term name="volume" form="short">
          <single>vol.</single>
          <multiple>vols</multiple>
        </term>
    
        <!-- SYMBOL LOCATOR FORMS -->
        <term name="paragraph" form="symbol">
          <single>¶</single>
          <multiple>¶¶</multiple>
        </term>
        <term name="section" form="symbol">
          <single>§</single>
          <multiple>§§</multiple>
        </term>
    
        <!-- LONG ROLE FORMS -->
        <term name="director">
          <single>director</single>
          <multiple>directors</multiple>
        </term>
        <term name="editor">
          <single>editor</single>
          <multiple>editors</multiple>
        </term>
        <term name="editorial-director">
          <single>editor</single>
          <multiple>editors</multiple>
        </term>
        <term name="illustrator">
          <single>illustrator</single>
          <multiple>illustrators</multiple>
        </term>
        <term name="translator">
          <single>translator</single>
          <multiple>translators</multiple>
        </term>
        <term name="editortranslator">
          <single>editor &amp; translator</single>
          <multiple>editors &amp; translators</multiple>
        </term>
    
        <!-- SHORT ROLE FORMS -->
        <term name="director" form="short">
          <single>dir.</single>
          <multiple>dirs.</multiple>
        </term>
        <term name="editor" form="short">
          <single>ed.</single>
          <multiple>eds.</multiple>
        </term>
        <term name="editorial-director" form="short">
          <single>ed.</single>
          <multiple>eds.</multiple>
        </term>
        <term name="illustrator" form="short">
          <single>ill.</single>
          <multiple>ills.</multiple>
        </term>
        <term name="translator" form="short">
          <single>tran.</single>
          <multiple>trans.</multiple>
        </term>
        <term name="editortranslator" form="short">
          <single>ed. &amp; tran.</single>
          <multiple>eds. &amp; trans.</multiple>
        </term>
    
        <!-- VERB ROLE FORMS -->
        <term name="container-author" form="verb">by</term>
        <term name="director" form="verb">directed by</term>
        <term name="editor" form="verb">edited by</term>
        <term name="editorial-director" form="verb">edited by</term>
        <term name="illustrator" form="verb">illustrated by</term>
        <term name="interviewer" form="verb">interview by</term>
        <term name="recipient" form="verb">to</term>
        <term name="reviewed-author" form="verb">by</term>
        <term name="translator" form="verb">translated by</term>
        <term name="editortranslator" form="verb">edited &amp; translated by</term>
    
        <!-- SHORT VERB ROLE FORMS -->
        <term name="director" form="verb-short">dir. by</term>
        <term name="editor" form="verb-short">ed. by</term>
        <term name="editorial-director" form="verb-short">ed. by</term>
        <term name="illustrator" form="verb-short">illus. by</term>
        <term name="translator" form="verb-short">trans. by</term>
        <term name="editortranslator" form="verb-short">ed. &amp; trans. by</term>
    
        <!-- LONG MONTH FORMS -->
        <term name="month-01">January</term>
        <term name="month-02">February</term>
        <term name="month-03">March</term>
        <term name="month-04">April</term>
        <term name="month-05">May</term>
        <term name="month-06">June</term>
        <term name="month-07">July</term>
        <term name="month-08">August</term>
        <term name="month-09">September</term>
        <term name="month-10">October</term>
        <term name="month-11">November</term>
        <term name="month-12">December</term>
    
        <!-- SHORT MONTH FORMS -->
        <term name="month-01" form="short">Jan.</term>
        <term name="month-02" form="short">Feb.</term>
        <term name="month-03" form="short">Mar.</term>
        <term name="month-04" form="short">Apr.</term>
        <term name="month-05" form="short">May</term>
        <term name="month-06" form="short">Jun.</term>
        <term name="month-07" form="short">Jul.</term>
        <term name="month-08" form="short">Aug.</term>
        <term name="month-09" form="short">Sep.</term>
        <term name="month-10" form="short">Oct.</term>
        <term name="month-11" form="short">Nov.</term>
        <term name="month-12" form="short">Dec.</term>
    
        <!-- SEASONS -->
        <term name="season-01">Spring</term>
        <term name="season-02">Summer</term>
        <term name="season-03">Autumn</term>
        <term name="season-04">Winter</term>
      </terms>
    </locale>`,
    'zh-CN' : `<?xml version="1.0" encoding="utf-8"?>
    <locale xmlns="http://purl.org/net/xbiblio/csl" version="1.0" xml:lang="zh-CN">
      <info>
        <translator>
          <name>rongls</name>
        </translator>
        <translator>
          <name>sati-bodhi</name>
        </translator>
        <translator>
          <name>Heromyth</name>
        </translator>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
        <updated>2014-05-15T23:31:02+00:00</updated>
      </info>
      <style-options punctuation-in-quote="false"/>
      <date form="text">
        <date-part name="year" suffix="年"/>
        <date-part name="month" form="numeric" suffix="月"/>
        <date-part name="day" suffix="日"/>
      </date>
      <date form="numeric">
        <date-part name="year"/>
        <date-part name="month" form="numeric-leading-zeros" prefix="/"/>
        <date-part name="day" form="numeric-leading-zeros" prefix="/"/>
      </date>
      <terms>
        <term name="accessed">见於</term>
        <term name="and">和</term>
        <term name="and others">及其他</term>
        <term name="anonymous">作者不详</term>
        <term name="anonymous" form="short">无名氏</term>
        <term name="at">於</term>
        <term name="available at">载於</term>
        <term name="by">著</term>
        <term name="circa">介于</term>
        <term name="circa" form="short">约</term>
        <term name="cited">见引於</term>
        <term name="edition">版本</term>
        <term name="edition" form="short">本</term>
        <term name="et-al">等</term>
        <term name="forthcoming">即将出版</term>
        <term name="from">从</term>
        <term name="ibid">同上</term>
        <term name="in">收入</term>
        <term name="in press">送印中</term>
        <term name="internet">网际网络</term>
        <term name="interview">访谈</term>
        <term name="letter">信函</term>
        <term name="no date">日期不详</term>
        <term name="no date" form="short">不详</term>
        <term name="online">在线</term>
        <term name="presented at">发表於</term>
        <term name="reference">参考</term>
        <term name="reference" form="short">参</term>
        <term name="retrieved">取读于</term>
        <term name="scale">比例</term>
        <term name="version">版</term>
    
        <!-- ANNO DOMINI; BEFORE CHRIST -->
        <term name="ad">公元</term>
        <term name="bc">公元前</term>
    
        <!-- PUNCTUATION -->
        <term name="open-quote">《</term>
        <term name="close-quote">》</term>
        <term name="open-inner-quote">〈</term>
        <term name="close-inner-quote">〉</term>
        <term name="page-range-delimiter">–</term>
    
        <!-- ORDINALS -->
        <term name="ordinal"></term>
      
        <!-- LONG ORDINALS -->
        <term name="long-ordinal-01">一</term>
        <term name="long-ordinal-02">二</term>
        <term name="long-ordinal-03">三</term>
        <term name="long-ordinal-04">四</term>
        <term name="long-ordinal-05">五</term>
        <term name="long-ordinal-06">六</term>
        <term name="long-ordinal-07">七</term>
        <term name="long-ordinal-08">八</term>
        <term name="long-ordinal-09">九</term>
        <term name="long-ordinal-10">十</term>
    
        <!-- LONG LOCATOR FORMS -->
        <term name="book">册</term>
        <term name="chapter">章</term>
        <term name="column">栏</term>
        <term name="figure">图表</term>       
        <term name="folio">版</term>
        <term name="issue">期</term>
        <term name="line">行</term>
        <term name="note">注脚</term>
        <term name="opus">作品</term>      
        <term name="page">页</term>
        <term name="number-of-pages"> 总页数</term>      
        <term name="paragraph">段落</term>
        <term name="part">部分</term>     
        <term name="section">节</term>         
        <term name="sub verbo">另见</term>    
        <term name="verse">篇</term>    
        <term name="volume">卷</term>
        
        <!-- SHORT LOCATOR FORMS -->
        <term name="book" form="short">册</term>
        <term name="chapter" form="short">章</term>
        <term name="column" form="short">栏</term>
        <term name="figure" form="short">图</term>
        <term name="folio" form="short">版</term>
        <term name="issue" form="short">期</term>
        <term name="line" form="short">行</term>
        <term name="note" form="short">注</term>
        <term name="opus" form="short">op.</term>
        <term name="page" form="short">页</term>   
        <term name="number-of-pages" form="short">共</term>    
        <term name="paragraph" form="short">段</term>
        <term name="part" form="short">部</term>
        <term name="section" form="short">节</term>
        <term name="sub verbo" form="short">另见</term>   
        <term name="verse" form="short">篇</term>      
        <term name="volume" form="short">卷</term>
        
        <!-- SYMBOL LOCATOR FORMS -->
        <term name="paragraph" form="symbol">
          <single>¶</single>
          <multiple>¶¶</multiple>
        </term>
        <term name="section" form="symbol">
          <single>§</single>
          <multiple>§§</multiple>
        </term>
    
        <!-- LONG ROLE FORMS -->
        <term name="director">导演</term>     
        <term name="editor">编辑</term> 
        <term name="editorial-director">主编</term>     
        <term name="illustrator">绘图</term>     
        <term name="translator">翻译</term>      
        <term name="editortranslator">编译</term>     
    
        <!-- SHORT ROLE FORMS -->
        <term name="director" form="short">导演</term>     
        <term name="editor" form="short">编</term>     
        <term name="editorial-director" form="short">主编</term>     
        <term name="illustrator" form="short">绘</term>   
        <term name="translator" form="short">译</term>     
        <term name="editortranslator" form="short">编译</term>    
    
        <!-- VERB ROLE FORMS -->
        <term name="container-author" form="verb">著</term>
        <term name="director" form="verb">指导</term>
        <term name="editor" form="verb">编辑</term>
        <term name="editorial-director" form="verb">主编</term>
        <term name="illustrator" form="verb">绘图</term>
        <term name="interviewer" form="verb">采访</term>
        <term name="recipient" form="verb">受函</term>
        <term name="reviewed-author" form="verb">校订</term>
        <term name="translator" form="verb">翻译</term>
        <term name="editortranslator" form="verb">编译</term>
    
        <!-- SHORT VERB ROLE FORMS -->
        <term name="director" form="verb-short">导</term>
        <term name="editor" form="verb-short">编</term>
        <term name="editorial-director" form="verb-short">主编</term>
        <term name="illustrator" form="verb-short">绘</term>
        <term name="translator" form="verb-short">译</term>
        <term name="editortranslator" form="verb-short">编译</term>
        <term name="reviewed-author" form="verb">校</term>
    
        <!-- LONG MONTH FORMS -->
        <term name="month-01">一月</term>
        <term name="month-02">二月</term>
        <term name="month-03">三月</term>
        <term name="month-04">四月</term>
        <term name="month-05">五月</term>
        <term name="month-06">六月</term>
        <term name="month-07">七月</term>
        <term name="month-08">八月</term>
        <term name="month-09">九月</term>
        <term name="month-10">十月</term>
        <term name="month-11">十一月</term>
        <term name="month-12">十二月</term>
    
        <!-- SHORT MONTH FORMS -->
        <term name="month-01" form="short">1月</term>
        <term name="month-02" form="short">2月</term>
        <term name="month-03" form="short">3月</term>
        <term name="month-04" form="short">4月</term>
        <term name="month-05" form="short">5月</term>
        <term name="month-06" form="short">6月</term>
        <term name="month-07" form="short">7月</term>
        <term name="month-08" form="short">8月</term>
        <term name="month-09" form="short">9月</term>
        <term name="month-10" form="short">10月</term>
        <term name="month-11" form="short">11月</term>
        <term name="month-12" form="short">12月</term>
    
        <!-- SEASONS -->
        <term name="season-01">春</term>
        <term name="season-02">夏</term>
        <term name="season-03">秋</term>
        <term name="season-04">冬</term>
      </terms>
    </locale>`
}

export default locales;