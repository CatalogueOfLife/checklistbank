 const styles = {
    "zookeys" : `<?xml version="1.0" encoding="utf-8"?>
    <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" default-locale="en-US">
      <info>
        <title>ZooKeys</title>
        <id>http://www.zotero.org/styles/zookeys</id>
        <link href="http://www.zotero.org/styles/zookeys" rel="self"/>
        <link href="http://www.zotero.org/styles/zootaxa" rel="template"/>
        <link href="http://www.pensoft.net/journals/zookeys/about/Author%20Guidelines" rel="documentation"/>
        <author>
          <name>Brian Stucky</name>
          <email>stuckyb@colorado.edu</email>
        </author>
        <category citation-format="author-date"/>
        <category field="biology"/>
        <issn>1313-2989</issn>
        <eissn>1313-2970</eissn>
        <summary>The ZooKeys style.</summary>
        <updated>2015-11-07T07:40:10+00:00</updated>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
      </info>
      <locale xml:lang="en-US">
        <date form="text">
          <date-part name="month" suffix=" "/>
          <date-part name="day" suffix=", "/>
          <date-part name="year"/>
        </date>
      </locale>
      <macro name="editor">
        <names variable="editor" delimiter=", ">
          <name initialize-with="" name-as-sort-order="all" sort-separator=" "/>
          <label form="short" prefix=" (" text-case="capitalize-first" suffix=")" strip-periods="true"/>
        </names>
      </macro>
      <macro name="anon">
        <text term="anonymous" form="short" text-case="capitalize-first" strip-periods="true"/>
      </macro>
      <macro name="author">
        <names variable="author">
          <name delimiter-precedes-last="never" initialize-with="" name-as-sort-order="all" sort-separator=" "/>
          <et-al font-style="italic"/>
          <label form="short" prefix=" " suffix="." text-case="lowercase" strip-periods="true"/>
          <substitute>
            <names variable="editor"/>
            <text macro="anon"/>
          </substitute>
        </names>
      </macro>
      <macro name="author-short">
        <names variable="author">
          <name form="short" delimiter=" " and="text" delimiter-precedes-last="never" initialize-with=". "/>
          <et-al font-style="normal"/>
          <substitute>
            <names variable="editor"/>
            <names variable="translator"/>
            <text macro="anon"/>
          </substitute>
        </names>
      </macro>
      <macro name="access">
        <choose>
          <if type="legal_case" match="none">
            <choose>
              <if variable="DOI">
                <group delimiter=" ">
                  <text variable="DOI" prefix="doi: "/>
                </group>
              </if>
              <else-if variable="URL">
                <group delimiter=" " suffix=".">
                  <text variable="URL" prefix="Available from: "/>
                  <group prefix="(" suffix=")">
                    <date variable="accessed" form="text"/>
                  </group>
                </group>
              </else-if>
            </choose>
          </if>
        </choose>
      </macro>
      <macro name="title">
        <choose>
          <if type="bill book graphic legal_case legislation motion_picture report song" match="any">
            <text variable="title" font-style="normal"/>
          </if>
          <else>
            <text variable="title" quotes="false"/>
          </else>
        </choose>
      </macro>
      <macro name="legal_case">
        <group prefix=" " delimiter=" ">
          <text variable="volume"/>
          <text variable="container-title"/>
        </group>
        <text variable="authority" prefix=" (" suffix=")"/>
      </macro>
      <macro name="publisher">
        <choose>
          <if type="thesis" match="none">
            <group delimiter=", ">
              <text variable="publisher"/>
              <text variable="publisher-place"/>
            </group>
            <text variable="genre" prefix=". "/>
          </if>
          <else>
            <group delimiter=". ">
              <text variable="genre"/>
              <text variable="publisher"/>
            </group>
          </else>
        </choose>
      </macro>
      <macro name="year-date">
        <choose>
          <if variable="issued">
            <group>
              <date variable="issued">
                <date-part name="year"/>
              </date>
            </group>
          </if>
          <else>
            <text term="no date" form="short"/>
          </else>
        </choose>
      </macro>
      <macro name="edition">
        <choose>
          <if is-numeric="edition">
            <group delimiter=" ">
              <number variable="edition" form="ordinal"/>
              <text term="edition" form="short" suffix="." strip-periods="true"/>
            </group>
          </if>
          <else>
            <text variable="edition" suffix="."/>
          </else>
        </choose>
      </macro>
      <macro name="locator">
        <choose>
          <if locator="page">
            <text variable="locator"/>
          </if>
          <else>
            <group delimiter=" ">
              <label variable="locator" form="short"/>
              <text variable="locator"/>
            </group>
          </else>
        </choose>
      </macro>
      <citation name-form="short" et-al-min="3" et-al-use-first="1" et-al-subsequent-min="3" et-al-subsequent-use-first="1" disambiguate-add-names="true" disambiguate-add-givenname="true" disambiguate-add-year-suffix="true" givenname-disambiguation-rule="primary-name" collapse="year">
        <sort>
          <key macro="year-date"/>
          <key macro="author-short"/>
        </sort>
        <layout delimiter=", " prefix="(" suffix=")">
          <group delimiter=", ">
            <group delimiter=" ">
              <text macro="author-short"/>
              <text macro="year-date"/>
            </group>
            <text macro="locator"/>
          </group>
        </layout>
      </citation>
      <bibliography hanging-indent="true">
        <sort>
          <key macro="author"/>
          <key macro="year-date"/>
          <key variable="title"/>
        </sort>
        <layout suffix=" ">
          <text macro="author" suffix=" ("/>
          <date variable="issued" suffix=")">
            <date-part name="year"/>
          </date>
          <choose>
            <if type="book" match="any">
              <text macro="legal_case"/>
              <group prefix=" " delimiter=" ">
                <text macro="title" font-style="normal" suffix="."/>
                <text macro="edition"/>
                <text macro="editor" suffix="."/>
              </group>
              <group prefix=" " suffix="." delimiter=", ">
                <text macro="publisher"/>
                <text variable="number-of-pages" prefix=" " suffix=" pp"/>
              </group>
            </if>
            <else-if type="chapter paper-conference" match="any">
              <text macro="title" prefix=" " suffix="."/>
              <group prefix=" In: " delimiter=" ">
                <text macro="editor" suffix=","/>
                <text variable="container-title" font-style="normal" suffix="."/>
                <text variable="collection-title" font-style="normal" suffix="."/>
                <group suffix=".">
                  <text macro="publisher"/>
                  <group delimiter=" " prefix=", " suffix=".">
                    <text variable="page"/>
                  </group>
                </group>
              </group>
            </else-if>
            <else-if type="bill graphic legal_case legislation manuscript motion_picture report song thesis" match="any">
              <text macro="legal_case"/>
              <group prefix=" " delimiter=" ">
                <text macro="title" suffix="."/>
                <text macro="edition"/>
                <text macro="editor" suffix="."/>
              </group>
              <group prefix=" " delimiter=", ">
                <text macro="publisher"/>
                <text variable="page" prefix=" " suffix="pp."/>
              </group>
            </else-if>
            <else>
              <group prefix=" " delimiter=" " suffix=".">
                <text macro="title"/>
                <text macro="editor"/>
              </group>
              <group prefix=" " suffix=".">
                <text variable="container-title" font-style="normal"/>
                <group prefix=" ">
                  <text variable="volume"/>
                </group>
                <text variable="page" prefix=": " suffix="."/>
              </group>
            </else>
          </choose>
          <text macro="access" prefix=" "/>
        </layout>
      </bibliography>
    </style>
    `,
    "nature": `<?xml version="1.0" encoding="utf-8"?>
    <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" default-locale="en-GB">
      <info>
        <title>Nature</title>
        <id>http://www.zotero.org/styles/nature</id>
        <link href="http://www.zotero.org/styles/nature" rel="self"/>
        <link href="http://www.nature.com/nature/authors/gta/index.html#a5.4" rel="documentation"/>
        <link href="http://www.nature.com/srep/publish/guidelines#references" rel="documentation"/>
        <author>
          <name>Michael Berkowitz</name>
          <email>mberkowi@gmu.edu</email>
        </author>
        <category citation-format="numeric"/>
        <category field="science"/>
        <category field="generic-base"/>
        <issn>0028-0836</issn>
        <eissn>1476-4687</eissn>
        <updated>2018-10-24T14:53:43+00:00</updated>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
      </info>
      <macro name="title">
        <choose>
          <if type="bill book graphic legal_case legislation motion_picture report song" match="any">
            <text variable="title" font-style="italic"/>
          </if>
          <else>
            <text variable="title"/>
          </else>
        </choose>
      </macro>
      <macro name="author">
        <names variable="author">
          <name sort-separator=", " delimiter=", " and="symbol" initialize-with=". " delimiter-precedes-last="never" name-as-sort-order="all"/>
          <label form="short" prefix=", "/>
          <et-al font-style="italic"/>
        </names>
      </macro>
      <macro name="access">
        <choose>
          <if variable="volume"/>
          <else-if variable="DOI">
            <text variable="DOI" prefix="doi:"/>
          </else-if>
          <else-if type="webpage" variable="URL" match="all">
            <text term="available at" text-case="capitalize-first" suffix=": "/>
            <text variable="URL" suffix=". "/>
            <group prefix="(" suffix=")" delimiter=": ">
              <text term="accessed" text-case="capitalize-first"/>
              <date variable="accessed">
                <date-part name="day" suffix=" " form="ordinal"/>
                <date-part name="month" suffix=" "/>
                <date-part name="year"/>
              </date>
            </group>
          </else-if>
        </choose>
      </macro>
      <macro name="issuance">
        <choose>
          <if type="bill book graphic legal_case legislation motion_picture report song thesis chapter paper-conference" match="any">
            <group delimiter=", " prefix="(" suffix=").">
              <text variable="publisher" form="long"/>
              <date variable="issued">
                <date-part name="year"/>
              </date>
            </group>
          </if>
          <else>
            <date prefix="(" suffix=")." variable="issued">
              <date-part name="year"/>
            </date>
          </else>
        </choose>
      </macro>
      <macro name="container-title">
        <choose>
          <if type="article-journal">
            <text variable="container-title" font-style="italic" form="short"/>
          </if>
          <else>
            <text variable="container-title" font-style="italic"/>
          </else>
        </choose>
      </macro>
      <macro name="editor">
        <choose>
          <if type="chapter paper-conference" match="any">
            <names variable="editor" prefix="(" suffix=")">
              <label form="short" suffix=" "/>
              <name and="symbol" delimiter-precedes-last="never" initialize-with=". " name-as-sort-order="all"/>
            </names>
          </if>
        </choose>
      </macro>
      <citation collapse="citation-number">
        <sort>
          <key variable="citation-number"/>
        </sort>
        <layout vertical-align="sup" delimiter=",">
          <text variable="citation-number"/>
        </layout>
      </citation>
      <bibliography et-al-min="6" et-al-use-first="1" second-field-align="flush" entry-spacing="0" line-spacing="2">
        <layout>
          <text variable="citation-number" suffix="."/>
          <group delimiter=" ">
            <text macro="author" suffix="."/>
            <text macro="title" suffix="."/>
            <choose>
              <if type="chapter paper-conference" match="any">
                <text term="in"/>
              </if>
            </choose>
            <text macro="container-title"/>
            <text macro="editor"/>
            <text variable="volume" font-weight="bold" suffix=","/>
            <text variable="page"/>
            <text macro="issuance"/>
            <text macro="access"/>
          </group>
        </layout>
      </bibliography>
    </style>`,
    "american-journal-of-botany" : `<?xml version="1.0" encoding="utf-8"?>
    <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" default-locale="en-GB">
      <info>
        <title>American Journal of Botany</title>
        <title-short>AJB</title-short>
        <id>http://www.zotero.org/styles/american-journal-of-botany</id>
        <link href="http://www.zotero.org/styles/american-journal-of-botany" rel="self"/>
        <link href="http://www.botany.org/ajb/ajb_Lit_Cited_Instructions.pdf" rel="documentation"/>
        <link href="https://onlinelibrary.wiley.com/page/journal/15372197/homepage/ForAuthors.html" rel="documentation"/>
        <author>
          <name>Eric Fuchs</name>
          <email>eric.fuchs@ucr.ac.cr</email>
        </author>
        <contributor>
          <name>Patrick O'Brien</name>
          <uri>https://twitter.com/patobrien333</uri>
        </contributor>
        <category citation-format="author-date"/>
        <category field="biology"/>
        <category field="botany"/>
        <category field="science"/>
        <issn>0002-9122</issn>
        <eissn>1537-2197</eissn>
        <summary>American Journal of Botany author-date style.</summary>
        <updated>2019-03-01T19:18:35+00:00</updated>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
      </info>
      <macro name="editor">
        <names variable="editor" delimiter=", ">
          <name and="text" initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>
          <label form="short" prefix=" [" suffix=".]," strip-periods="true"/>
        </names>
      </macro>
      <macro name="anon">
        <text term="anonymous" form="short" text-case="capitalize-first" strip-periods="true"/>
      </macro>
      <macro name="author">
        <names variable="author">
          <name font-variant="normal" and="text" delimiter-precedes-last="always" initialize-with=". " name-as-sort-order="first"/>
          <label form="short" prefix=" " suffix=" "/>
          <substitute>
            <names variable="editor"/>
            <text macro="anon"/>
          </substitute>
        </names>
      </macro>
      <macro name="author-short">
        <names variable="author">
          <name form="short" and="text" delimiter=", " delimiter-precedes-last="never" initialize-with=". "/>
          <substitute>
            <names variable="editor"/>
            <names variable="translator"/>
            <text macro="anon"/>
          </substitute>
        </names>
      </macro>
      <macro name="access">
        <choose>
          <if type="webpage post post-weblog" match="any">
            <group delimiter=" ">
              <text value="Website" suffix=" "/>
              <text variable="URL"/>
              <group prefix="[" suffix="]">
                <text term="accessed" suffix=" "/>
                <date form="text" variable="accessed"/>
              </group>
            </group>
          </if>
        </choose>
      </macro>
      <macro name="title">
        <choose>
          <if type="bill book graphic legal_case legislation motion_picture report song thesis" match="any">
            <text variable="title" font-style="normal"/>
          </if>
          <else>
            <text variable="title"/>
          </else>
        </choose>
      </macro>
      <macro name="publisher">
        <group delimiter=", ">
          <text variable="publisher"/>
          <text variable="publisher-place"/>
        </group>
      </macro>
      <macro name="year-date">
        <choose>
          <if variable="issued">
            <date variable="issued">
              <date-part name="year"/>
            </date>
          </if>
          <else>
            <text term="no date" form="short"/>
          </else>
        </choose>
      </macro>
      <macro name="edition">
        <choose>
          <if is-numeric="edition">
            <group delimiter=" ">
              <number variable="edition" form="ordinal"/>
              <text term="edition" form="short"/>
            </group>
          </if>
          <else>
            <text variable="edition" suffix="."/>
          </else>
        </choose>
      </macro>
      <citation et-al-min="3" et-al-use-first="1" disambiguate-add-year-suffix="true" disambiguate-add-names="true" collapse="year-suffix">
        <sort>
          <key macro="year-date"/>
        </sort>
        <layout prefix="(" suffix=")" delimiter="; ">
          <group delimiter=" ">
            <group delimiter=", ">
              <text macro="author-short"/>
              <text macro="year-date"/>
            </group>
            <group>
              <label variable="locator" suffix=" " form="short"/>
              <text variable="locator"/>
            </group>
          </group>
        </layout>
      </citation>
      <bibliography hanging-indent="true" et-al-min="9" et-al-use-first="7">
        <sort>
          <key macro="author"/>
          <key variable="title"/>
        </sort>
        <layout suffix=".">
          <text macro="author" suffix="."/>
          <date variable="issued" prefix=" " suffix=".">
            <date-part name="year"/>
          </date>
          <choose>
            <if type="bill book graphic legal_case legislation motion_picture report song" match="any">
              <group prefix=" " delimiter=". " suffix=".">
                <text macro="title"/>
                <text macro="edition"/>
                <text macro="editor"/>
              </group>
              <text prefix=" " suffix="." macro="publisher"/>
            </if>
            <else-if type="chapter paper-conference" match="any">
              <text macro="title" prefix=" " suffix="."/>
              <group delimiter=", " prefix=" ">
                <group delimiter=" ">
                  <text term="in" text-case="capitalize-first" font-style="italic"/>
                  <text macro="editor"/>
                </group>
                <text variable="container-title" font-style="normal" suffix=","/>
                <text variable="collection-title" suffix=","/>
                <group delimiter=". ">
                  <text variable="page"/>
                  <text macro="publisher" prefix=" "/>
                </group>
              </group>
            </else-if>
            <else-if type="thesis">
              <group prefix=" " suffix="." delimiter=". ">
                <text macro="title"/>
                <text variable="genre"/>
                <text macro="publisher"/>
              </group>
            </else-if>
            <else>
              <group suffix=".">
                <text macro="title" prefix=" "/>
                <text macro="editor" prefix=" "/>
              </group>
              <group delimiter=": " prefix=" " suffix=".">
                <group delimiter=" ">
                  <text variable="container-title" font-style="italic"/>
                  <text variable="volume"/>
                </group>
                <text variable="page"/>
              </group>
            </else>
          </choose>
          <text prefix=" " macro="access" suffix="."/>
        </layout>
      </bibliography>
    </style>
    `,
    "mycologia": `<?xml version="1.0" encoding="utf-8"?>
    <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" default-locale="en-US">
      <!-- This style was edited with the Visual CSL Editor (http://editor.citationstyles.org/visualEditor/) -->
      <info>
        <title>Mycologia</title>
        <id>http://www.zotero.org/styles/mycologia</id>
        <link href="http://www.zotero.org/styles/mycologia" rel="self"/>
        <link href="http://www.mycologia.org/content/105/1/230.full" rel="documentation"/>
        <author>
          <name>Franck Stefani</name>
          <email>fopstefani@gmail.com</email>
        </author>
        <category citation-format="author-date"/>
        <category field="biology"/>
        <issn>0027-5514</issn>
        <updated>2014-01-10T17:16:40+00:00</updated>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
      </info>
      <macro name="author-short">
        <names variable="author">
          <name form="short" and="text"/>
          <substitute>
            <names variable="editor"/>
            <text variable="title"/>
          </substitute>
        </names>
      </macro>
      <macro name="author">
        <names variable="author">
          <name delimiter-precedes-last="always" initialize-with="" name-as-sort-order="all" sort-separator=" "/>
          <label form="short" prefix=", "/>
          <substitute>
            <names variable="editor"/>
            <text variable="title"/>
          </substitute>
        </names>
      </macro>
      <macro name="issued">
        <date variable="issued">
          <date-part name="year"/>
        </date>
      </macro>
      <macro name="publisher">
        <group delimiter=": ">
          <text variable="publisher-place"/>
          <text variable="publisher"/>
        </group>
      </macro>
      <macro name="editor">
        <names variable="editor">
          <name initialize-with="." and="text" delimiter-precedes-last="always"/>
          <label form="short" prefix=", "/>
        </names>
      </macro>
      <citation et-al-min="3" et-al-use-first="1" disambiguate-add-year-suffix="true" collapse="year">
        <sort>
          <key macro="issued"/>
          <key macro="author"/>
        </sort>
        <layout delimiter=", " prefix="(" suffix=")">
          <group delimiter=" ">
            <text macro="author-short"/>
            <text macro="issued"/>
          </group>
        </layout>
      </citation>
      <bibliography et-al-min="30" et-al-use-first="29">
        <sort>
          <key macro="author"/>
          <key macro="issued"/>
          <key variable="title"/>
        </sort>
        <layout suffix=".">
          <group delimiter=". ">
            <text macro="author"/>
            <text macro="issued"/>
            <choose>
              <if type="article article-magazine article-newspaper article-journal review" match="any">
                <text variable="title" suffix="."/>
                <text variable="container-title" form="short" text-case="title" strip-periods="true"/>
                <group delimiter=", ">
                  <group delimiter=":">
                    <text variable="volume"/>
                    <text variable="page"/>
                  </group>
                  <text variable="DOI" prefix="doi:"/>
                </group>
              </if>
              <else-if type="chapter paper-conference" match="any">
                <text variable="title"/>
                <group prefix="In: " delimiter=". ">
                  <text macro="editor"/>
                  <text variable="container-title" text-case="title" strip-periods="true"/>
                  <text macro="publisher"/>
                  <label variable="page" form="short" strip-periods="true"/>
                  <text variable="page"/>
                </group>
              </else-if>
              <else-if type="thesis">
                <text variable="title" suffix="."/>
                <text variable="genre" suffix="."/>
                <text variable="publisher"/>
              </else-if>
              <else>
                <text variable="title"/>
                <text macro="publisher"/>
                <text variable="number-of-pages" suffix=" p"/>
              </else>
            </choose>
          </group>
        </layout>
      </bibliography>
    </style>
    `,
    "science" : `<?xml version="1.0" encoding="utf-8"?>
    <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" default-locale="en-US">
      <info>
        <title>Science</title>
        <id>http://www.zotero.org/styles/science</id>
        <link href="http://www.zotero.org/styles/science" rel="self"/>
        <link href="http://www.sciencemag.org/about/authors/prep/res/refs.dtl" rel="documentation"/>
        <author>
          <name>Julian Onions</name>
          <email>julian.onions@gmail.com</email>
        </author>
        <contributor>
          <name>Sebastian Karcher</name>
        </contributor>
        <contributor>
          <name>Greg Barendt</name>
        </contributor>
        <category citation-format="numeric"/>
        <category field="science"/>
        <issn>0036-8075</issn>
        <eissn>1095-9203</eissn>
        <summary>The Science journal style.</summary>
        <updated>2014-06-18T08:06:38+00:00</updated>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
      </info>
      <macro name="editor">
        <names variable="editor" delimiter=", ">
          <name initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>
          <label form="short" prefix=", " text-case="capitalize-first"/>
        </names>
      </macro>
      <macro name="author">
        <names variable="author">
          <name sort-separator=", " initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>
          <label form="short" prefix=", " text-case="capitalize-first"/>
          <et-al font-style="italic"/>
          <substitute>
            <names variable="editor"/>
          </substitute>
        </names>
      </macro>
      <macro name="access">
        <choose>
          <if variable="page" match="none">
            <text macro="access-value"/>
          </if>
          <else-if is-numeric="page" match="none">
            <text macro="access-value"/>
          </else-if>
        </choose>
      </macro>
      <macro name="access-value">
        <choose>
          <if variable="DOI">
            <text variable="DOI" prefix=", doi:"/>
          </if>
          <else>
            <group prefix=" (" suffix=")">
              <text value="available at "/>
              <text variable="URL"/>
            </group>
          </else>
        </choose>
      </macro>
      <macro name="title">
        <choose>
          <if type="bill book graphic legal_case legislation motion_picture report song" match="any">
            <text variable="title" font-style="italic"/>
          </if>
          <else>
            <text variable="title"/>
          </else>
        </choose>
      </macro>
      <macro name="article-details">
        <group delimiter=", ">
          <group delimiter=". ">
            <text macro="title"/>
            <text form="short" variable="container-title" font-style="italic"/>
            <text variable="volume" font-weight="bold"/>
          </group>
          <text variable="page"/>
        </group>
        <text macro="issued" prefix=" (" suffix=")"/>
        <text macro="access"/>
      </macro>
      <macro name="publisher">
        <group delimiter=", ">
          <text variable="publisher"/>
          <text variable="publisher-place"/>
        </group>
      </macro>
      <macro name="pages">
        <label variable="page" form="short" suffix=" "/>
        <text variable="page" form="short"/>
      </macro>
      <macro name="issued">
        <date variable="issued" delimiter=" ">
          <date-part name="year"/>
        </date>
      </macro>
      <macro name="edition">
        <choose>
          <if is-numeric="edition">
            <group delimiter=" ">
              <text term="edition" form="short"/>
              <number variable="edition" form="numeric"/>
            </group>
          </if>
          <else>
            <text variable="edition" suffix="."/>
          </else>
        </choose>
      </macro>
      <citation collapse="citation-number">
        <sort>
          <key variable="citation-number"/>
        </sort>
        <layout prefix="(" suffix=")" delimiter=", ">
          <text variable="citation-number" font-style="italic"/>
        </layout>
      </citation>
      <bibliography et-al-min="6" et-al-use-first="1" second-field-align="flush">
        <layout suffix=".">
          <text variable="citation-number" suffix=". "/>
          <group delimiter=", ">
            <text macro="author"/>
            <choose>
              <if type="thesis">
                <group delimiter=" ">
                  <group delimiter=", ">
                    <group>
                      <!-- Always print, even if no university given -->
                      <text value="thesis"/>
                    </group>
                    <text macro="publisher"/>
                  </group>
                  <text macro="issued" prefix="(" suffix=")"/>
                </group>
              </if>
              <else-if type="bill book graphic legal_case legislation motion_picture song chapter paper-conference" match="any">
                <group delimiter=" ">
                  <choose>
                    <if type="chapter paper-conference" match="any">
                      <group delimiter=", ">
                        <group delimiter=" ">
                          <text term="in"/>
                          <text variable="container-title" font-style="italic"/>
                        </group>
                        <text macro="editor"/>
                      </group>
                    </if>
                    <else>
                      <text macro="title"/>
                    </else>
                  </choose>
                  <group prefix="(" suffix=")" delimiter="; ">
                    <group delimiter=", ">
                      <text macro="publisher"/>
                      <text macro="edition"/>
                      <text macro="issued"/>
                    </group>
                    <text variable="URL"/>
                  </group>
                </group>
                <group delimiter=" of ">
                  <group>
                    <label variable="volume" form="short" suffix=" "/>
                    <number variable="volume"/>
                  </group>
                  <text variable="collection-title" font-style="italic"/>
                </group>
                <choose>
                  <if type="chapter paper-conference" match="any">
                    <text macro="pages"/>
                  </if>
                </choose>
              </else-if>
              <else-if type="article-journal">
                <choose>
                  <if variable="page">
                    <choose>
                      <if is-numeric="page" match="none">
                        <group>
                          <group delimiter=", ">
                            <text variable="container-title" form="short" font-style="italic"/>
                            <group>
                              <text term="in press"/>
                            </group>
                          </group>
                          <text macro="access"/>
                        </group>
                      </if>
                      <else>
                        <text macro="article-details"/>
                      </else>
                    </choose>
                  </if>
                  <else>
                    <text macro="article-details"/>
                  </else>
                </choose>
              </else-if>
              <else-if type="report">
                <group>
                  <group delimiter=", ">
                    <text variable="title" quotes="true"/>
                    <text variable="collection-title" font-style="italic"/>
                  </group>
                  <group prefix=" (" suffix=")" delimiter=", ">
                    <group delimiter=" ">
                      <text variable="genre" form="short"/>
                      <number variable="number"/>
                    </group>
                    <text variable="publisher"/>
                    <text variable="publisher-place"/>
                    <text macro="issued"/>
                  </group>
                </group>
                <text macro="pages"/>
                <text macro="access"/>
              </else-if>
              <else>
                <group>
                  <group delimiter=", ">
                    <text macro="editor"/>
                    <group delimiter=". ">
                      <text macro="title"/>
                      <text form="short" variable="container-title" font-style="italic"/>
                      <text variable="volume" font-weight="bold"/>
                    </group>
                  </group>
                  <text macro="issued" prefix=" (" suffix=")"/>
                </group>
                <text macro="pages"/>
                <text macro="access"/>
              </else>
            </choose>
          </group>
        </layout>
      </bibliography>
    </style>
    `,
    "council-of-science-editors" : `<?xml version="1.0" encoding="utf-8"?>
    <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" default-locale="en-US">
      <info>
        <title>Council of Science Editors, Citation-Sequence (numeric)</title>
        <title-short>CSE C-S</title-short>
        <id>http://www.zotero.org/styles/council-of-science-editors</id>
        <link href="http://www.zotero.org/styles/council-of-science-editors" rel="self"/>
        <link href="http://www.scientificstyleandformat.org/Tools/SSF-Citation-Quick-Guide.html" rel="documentation"/>
        <author>
          <name>Julian Onions</name>
          <email>julian.onions@gmail.com</email>
        </author>
        <contributor>
          <name>Patrick O'Brien</name>
        </contributor>
        <category citation-format="numeric"/>
        <category field="science"/>
        <summary>The Council of Science Editors style 8th edition, Citation-Sequence system: numbers in text, sorted by order of appearance in text.</summary>
        <updated>2017-07-19T13:51:13+00:00</updated>
        <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>
      </info>
      <locale xml:lang="en">
        <terms>
          <term name="editortranslator" form="long">
            <single>editor and translator</single>
            <multiple>editors and translators</multiple>
          </term>
          <term name="collection-editor" form="long">
            <single>editor</single>
            <multiple>editors</multiple>
          </term>
        </terms>
      </locale>
      <macro name="editor">
        <names variable="editor translator" delimiter="; " suffix=".">
          <name delimiter-precedes-last="always" initialize-with="" name-as-sort-order="all" sort-separator=" "/>
          <label prefix=", "/>
        </names>
      </macro>
      <macro name="author">
        <names variable="author" delimiter="; ">
          <name name-as-sort-order="all" sort-separator=" " initialize-with="" delimiter=", " delimiter-precedes-last="always"/>
          <label form="long" prefix=", " strip-periods="true"/>
          <substitute>
            <names variable="editor translator"/>
            <text variable="title"/>
          </substitute>
        </names>
      </macro>
      <macro name="access">
        <choose>
          <if variable="accessed" match="any">
            <text variable="URL"/>
          </if>
        </choose>
      </macro>
      <macro name="title">
        <group delimiter=" ">
          <text variable="title"/>
          <choose>
            <if type="thesis" match="any">
              <text variable="genre" form="long" prefix="[" suffix="]"/>
            </if>
          </choose>
        </group>
      </macro>
      <macro name="publisher">
        <group delimiter=": ">
          <text variable="publisher-place"/>
          <text variable="publisher"/>
        </group>
      </macro>
      <macro name="review">
        <group delimiter=". ">
          <text variable="reviewed-title"/>
          <text variable="container-title"/>
        </group>
      </macro>
      <macro name="issued">
        <group delimiter=" ">
          <date variable="issued" delimiter=" ">
            <date-part name="year"/>
          </date>
          <choose>
            <if type="patent article-newspaper webpage" match="any">
              <date variable="issued" delimiter=" ">
                <date-part name="month" form="short" strip-periods="true"/>
                <date-part name="day"/>
              </date>
            </if>
            <else-if type="article-journal article-magazine" match="any">
              <choose>
                <if variable="volume issue" match="none">
                  <date variable="issued" delimiter=" ">
                    <date-part name="month" form="short" strip-periods="true"/>
                    <date-part name="day"/>
                  </date>
                </if>
              </choose>
            </else-if>
          </choose>
          <group prefix=" [" suffix="]" delimiter=" ">
            <text term="accessed"/>
            <date variable="accessed" delimiter=" ">
              <date-part name="year"/>
              <date-part name="month" form="short" strip-periods="true"/>
              <date-part name="day"/>
            </date>
          </group>
        </group>
      </macro>
      <macro name="pages">
        <group>
          <label variable="page" form="short" suffix=" " plural="never"/>
          <text variable="page"/>
        </group>
      </macro>
      <macro name="edition">
        <choose>
          <if is-numeric="edition">
            <group delimiter=" ">
              <number variable="edition" form="ordinal"/>
              <text term="edition" form="short"/>
            </group>
          </if>
          <else>
            <text variable="edition" suffix="."/>
          </else>
        </choose>
      </macro>
      <macro name="collection">
        <choose>
          <if type="report">
            <group prefix=" " suffix="." delimiter=" ">
              <text variable="collection-title"/>
              <text variable="number" prefix=" Report No.: "/>
            </group>
          </if>
          <else>
            <group prefix=" (" suffix=")." delimiter=" ">
              <names variable="collection-editor" suffix=". ">
                <name delimiter-precedes-last="always" initialize-with="" name-as-sort-order="all" sort-separator=" "/>
                <label prefix=", "/>
              </names>
              <text variable="collection-title"/>
            </group>
          </else>
        </choose>
      </macro>
      <citation collapse="citation-number">
        <sort>
          <key variable="citation-number"/>
        </sort>
        <layout delimiter="," vertical-align="sup">
          <text variable="citation-number"/>
          <group prefix="(" suffix=")">
            <label variable="locator" form="short" strip-periods="true"/>
            <text variable="locator"/>
          </group>
        </layout>
      </citation>
      <bibliography hanging-indent="false" et-al-min="11" et-al-use-first="10">
        <layout>
          <text variable="citation-number" suffix=". "/>
          <text macro="author" suffix="."/>
          <choose>
            <if type="bill book graphic legal_case legislation motion_picture report song thesis" match="any">
              <group prefix=" " suffix="." delimiter=" ">
                <text macro="title" suffix="."/>
                <text macro="edition"/>
                <text macro="editor"/>
                <group prefix=" " delimiter="; ">
                  <text macro="publisher"/>
                  <group suffix="." delimiter=". ">
                    <date variable="issued">
                      <date-part name="year"/>
                    </date>
                  </group>
                </group>
                <text macro="pages"/>
              </group>
            </if>
            <else-if type="chapter paper-conference entry-dictionary entry-encyclopedia" match="any">
              <text macro="title" prefix=" " suffix="."/>
              <group prefix=" " delimiter=" ">
                <group delimiter=" ">
                  <text term="in" text-case="capitalize-first" suffix=":"/>
                  <text macro="editor"/>
                  <text variable="container-title" suffix="."/>
                </group>
                <group delimiter=" " suffix=".">
                  <label text-case="capitalize-first" variable="volume" form="short"/>
                  <text variable="volume"/>
                </group>
                <text macro="edition"/>
                <group suffix=".">
                  <group prefix=" " delimiter="; ">
                    <text macro="publisher"/>
                    <group suffix="." delimiter=". ">
                      <date variable="issued">
                        <date-part name="year"/>
                      </date>
                      <text macro="pages"/>
                    </group>
                  </group>
                </group>
              </group>
            </else-if>
            <else-if type="review review-book" match="any">
              <group suffix=".">
                <text macro="title" prefix=" "/>
                <text macro="editor" prefix=" "/>
              </group>
              <group prefix=" " suffix=".">
                <text macro="review" suffix="."/>
                <group delimiter=";" prefix=" ">
                  <text macro="issued"/>
                  <group>
                    <text variable="volume"/>
                    <text variable="issue" prefix="(" suffix=")"/>
                  </group>
                </group>
                <text variable="page" prefix=":"/>
              </group>
            </else-if>
            <else>
              <group suffix=".">
                <text macro="title" prefix=" "/>
                <text macro="editor" prefix=" "/>
              </group>
              <group prefix=" " suffix=".">
                <text variable="container-title" suffix="."/>
                <group delimiter=";" prefix=" ">
                  <text macro="issued"/>
                  <group>
                    <text variable="volume"/>
                    <text variable="issue" prefix="(" suffix=")"/>
                  </group>
                </group>
                <text variable="page" prefix=":"/>
              </group>
            </else>
          </choose>
          <text prefix=" " macro="collection"/>
          <text prefix=" " macro="access"/>
          <text variable="DOI" prefix=". doi:"/>
        </layout>
      </bibliography>
    </style>
    `
}

export default styles